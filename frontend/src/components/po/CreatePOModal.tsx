import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Plus, 
  Trash2, 
  ScanLine, 
  Search, 
  HelpCircle, 
  Package, 
  Calendar, 
  Download,
  AlertCircle,
  CheckCircle2,
  Info,
  Building2,
  DollarSign,
  Percent,
  FileCheck,
  ShoppingCart,
  Loader2,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';
import { purchaseOrdersService } from '@/services/purchaseOrders.service';
import { vendorsService } from '@/services/vendors.service';
import { productsService } from '@/services/products.service';
import { settingsService } from '@/services/settings.service';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { downloadCSVTemplate, parseCSV, csvTemplates } from '@/utils/csvTemplates';
import { formatCurrency } from '@/lib/utils';
import { useAlert } from '@/hooks/useSweetAlert';
import { SweetAlert } from '@/components/ui/SweetAlert';
import api from '@/lib/api';

interface POItem {
  productId: string;
  productName: string;
  sku?: string;
  barcode?: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  unit?: string;
  total: number;
}

interface FormErrors {
  vendorId?: string;
  storeId?: string;
  items?: string;
  [key: string]: string | undefined;
}

interface CreatePOModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'details' | 'items' | 'summary' | 'notes';

export default function CreatePOModal({ onClose, onSuccess }: CreatePOModalProps) {
  const alert = useAlert();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [vendorId, setVendorId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [items, setItems] = useState<POItem[]>([]);
  const [expectedDate, setExpectedDate] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [productSearchInput, setProductSearchInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkProducts, setBulkProducts] = useState('');
  const [bulkProductsFile, setBulkProductsFile] = useState<File | null>(null);
  const [productFilter, setProductFilter] = useState<'all' | 'vendor'>('all');
  const [errors, setErrors] = useState<FormErrors>({});
  const [holdScreen, setHoldScreen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Debounce search input
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (productSearchInput.trim().length >= 2) {
      timeoutId = setTimeout(() => {
        setProductSearch(productSearchInput.trim());
      }, 300);
    } else {
      setProductSearch('');
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [productSearchInput]);

  // Fetch vendors
  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors-for-po'],
    queryFn: () => vendorsService.getAll({ limit: 1000 }),
  });

  // Fetch selected vendor details
  const { data: selectedVendor } = useQuery({
    queryKey: ['vendor-details', vendorId],
    queryFn: () => vendorsService.getById(vendorId),
    enabled: !!vendorId,
  });

  // Fetch stores - Fixed endpoint
  const { data: storesData, isLoading: storesLoading, error: storesError, refetch: refetchStores } = useQuery({
    queryKey: ['stores-for-po'],
    queryFn: async () => {
      try {
        const response = await api.get('/stores');
        // Backend returns: { success: true, data: { stores: [...] } }
        const stores = response.data?.data?.stores || response.data?.stores || [];
        return Array.isArray(stores) ? stores : [];
      } catch (error: any) {
        console.error('Error fetching stores:', error);
        throw error;
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch products based on search
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-po', productSearch, productFilter, vendorId],
    queryFn: async () => {
      if (!productSearch || productSearch.trim().length < 2) {
        return { products: [] };
      }
      
      try {
        const params: any = { 
          limit: 50,
          page: 1,
          search: productSearch.trim(),
          isActive: 'true',
        };
        
        const result = await productsService.getAll(params);
        return result;
      } catch (error: any) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
    enabled: productSearch && productSearch.trim().length >= 2,
  });

  // Update search results when products data changes
  useEffect(() => {
    if (productsData?.products) {
      let filtered = productsData.products;
      
      // Filter by vendor if needed
      if (productFilter === 'vendor' && vendorId && selectedVendor?.products) {
        const vendorProductIds = selectedVendor.products.map((p: any) => 
          typeof p === 'string' ? p : (p._id || p.id || p.toString())
        );
        filtered = filtered.filter((p: any) => {
          const productId = p._id || p.id;
          return vendorProductIds.includes(productId?.toString());
        });
      }
      
      setSearchResults(filtered);
      setShowSearchResults(filtered.length > 0 && productSearch.length >= 2);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [productsData, productFilter, vendorId, selectedVendor, productSearch]);

  const vendors = vendorsData?.vendors || [];
  const stores = Array.isArray(storesData) ? storesData : [];

  const addProductToItems = (product: any) => {
    const newItem: POItem = {
      productId: product._id || product.id || '',
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: typeof product.category === 'object' && product.category?.name 
        ? product.category.name 
        : (typeof product.category === 'string' ? product.category : ''),
      quantity: 1,
      unitPrice: product.cost || product.price || 0,
      discount: 0,
      tax: product.taxRate || 0,
      unit: product.unit,
      total: product.cost || product.price || 0,
    };

    setItems([...items, newItem]);
    
    // Clear search and results
    setProductSearchInput('');
    setProductSearch('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    // Focus back on search input if not holding screen
    if (!holdScreen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    
    // Switch to items tab if not holding screen
    if (!holdScreen) {
      setActiveTab('items');
    }
  };

  const handleProductClick = (product: any) => {
    addProductToItems(product);
  };

  const createMutation = useMutation({
    mutationFn: purchaseOrdersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['po-stats'] });
      alert.success('Purchase Order Created!', 'Your purchase order has been created successfully.', () => {
        onSuccess();
        onClose();
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create Purchase Order';
      alert.error('Error Creating Purchase Order', message);
      
      if (error.response?.data?.error?.details) {
        const fieldErrors: FormErrors = {};
        error.response.data.error.details.forEach((detail: any) => {
          fieldErrors[detail.field] = detail.message;
        });
        setErrors(fieldErrors);
      }
    },
  });

  const addItem = () => {
    setItems([...items, { 
      productId: '', 
      productName: '', 
      quantity: 1, 
      unitPrice: 0, 
      discount: 0,
      tax: 0,
      total: 0 
    }]);
    setActiveTab('items');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'productId' && value) {
      const product = searchResults.find((p: any) => (p._id || p.id) === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].sku = product.sku;
        newItems[index].barcode = product.barcode;
        newItems[index].category = typeof product.category === 'object' && product.category?.name 
          ? product.category.name 
          : (typeof product.category === 'string' ? product.category : '');
        newItems[index].unitPrice = product.cost || product.price || 0;
        newItems[index].unit = product.unit;
        if (product.taxRate !== undefined) {
          newItems[index].tax = product.taxRate;
        }
      }
    }
    
    // Recalculate total
    const item = newItems[index];
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax / 100);
    newItems[index].total = afterDiscount + taxAmount;
    
    setItems(newItems);
    
    // Clear errors for this item
    if (errors[`items.${index}.${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`items.${index}.${field}`];
      setErrors(newErrors);
    }
  };

  const handleBarcodeScan = async (code: string) => {
    try {
      const product = await productsService.getByBarcode(code);
      if (product) {
        addProductToItems(product);
        alert.success('Product Added', `Product "${product.name}" has been added to the order.`);
      } else {
        alert.error('Product Not Found', 'Product not found for this barcode.');
      }
    } catch (error: any) {
      alert.error('Product Not Found', error.response?.data?.error?.message || 'Product not found');
    }
  };

  const handleBulkAdd = async () => {
    try {
      let csvContent = '';
      
      if (bulkProductsFile) {
        const text = await bulkProductsFile.text();
        csvContent = text;
      } else if (bulkProducts.trim()) {
        csvContent = bulkProducts.trim();
      } else {
        alert.warning('No Data', 'Please upload a CSV file or paste CSV content.');
        return;
      }

      const parsed = parseCSV(csvContent);
      if (parsed.length === 0) {
        alert.warning('Invalid CSV', 'No valid products found in CSV.');
        return;
      }

      const newItems: POItem[] = [];
      for (const row of parsed) {
        const identifier = row[0]?.trim(); // SKU or barcode
        if (!identifier) continue;

        try {
          let product: any = null;
          
          // Try to find by SKU first
          const products = await productsService.getAll({ search: identifier, limit: 1 });
          product = products.products?.[0];
          
          if (!product) {
            // Try by barcode
            try {
              product = await productsService.getByBarcode(identifier);
            } catch {}
          }

          if (product) {
            const quantity = parseFloat(row[1]?.trim() || '1') || 1;
            const unitPrice = parseFloat(row[2]?.trim() || '0') || (product.cost || product.price || 0);
            
            newItems.push({
              productId: product._id || product.id,
              productName: product.name,
              sku: product.sku,
              barcode: product.barcode,
              category: typeof product.category === 'object' && product.category?.name 
                ? product.category.name 
                : (typeof product.category === 'string' ? product.category : ''),
              quantity,
              unitPrice,
              discount: 0,
              tax: product.taxRate || 0,
              unit: product.unit,
              total: quantity * unitPrice,
            });
          }
        } catch (error) {
          console.error(`Error processing product ${identifier}:`, error);
        }
      }

      if (newItems.length > 0) {
        setItems([...items, ...newItems]);
        setBulkProducts('');
        setBulkProductsFile(null);
        setShowBulkAdd(false);
        alert.success('Products Added', `${newItems.length} product(s) added successfully.`);
      } else {
        alert.warning('No Products Added', 'Could not find any products matching the CSV data.');
      }
    } catch (error: any) {
      alert.error('Bulk Add Failed', error.message || 'Failed to process bulk add.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!vendorId) {
      newErrors.vendorId = 'Vendor is required';
    }
    
    if (!storeId) {
      newErrors.storeId = 'Store is required';
    }
    
    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    }
    
    items.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`items.${index}.productId`] = 'Product is required';
      }
      if (item.quantity <= 0) {
        newErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice <= 0) {
        newErrors[`items.${index}.unitPrice`] = 'Unit price must be greater than 0';
      }
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.vendorId || newErrors.storeId) {
        setActiveTab('details');
      } else if (newErrors.items || Object.keys(newErrors).some(k => k.startsWith('items.'))) {
        setActiveTab('items');
      }
      return false;
    }
    
    return true;
  };

  const subtotal = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const discountAmount = itemSubtotal * (item.discount / 100);
    return sum + itemSubtotal - discountAmount;
  }, 0);
  
  const totalTax = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const discountAmount = itemSubtotal * (item.discount / 100);
    const afterDiscount = itemSubtotal - discountAmount;
    return sum + (afterDiscount * (item.tax / 100));
  }, 0);
  
  const grandTotal = subtotal + totalTax + shippingCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createMutation.mutate({
      vendorId,
      storeId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || undefined,
        tax: item.tax || undefined,
      })),
      expectedDeliveryDate: expectedDate || undefined,
      shippingCost: shippingCost || undefined,
      paymentTerms: paymentTerms || undefined,
      notes: notes || undefined,
    });
  };

  const tabs = [
    { id: 'details' as TabType, label: 'Details', icon: FileCheck },
    { id: 'items' as TabType, label: `Items (${items.length})`, icon: ShoppingCart },
    { id: 'summary' as TabType, label: 'Summary', icon: Info },
    { id: 'notes' as TabType, label: 'Notes', icon: FileText },
  ];

  const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  const FieldLabel = ({ 
    label, 
    required, 
    hint, 
    error 
  }: { 
    label: string; 
    required?: boolean; 
    hint?: string; 
    error?: string;
  }) => (
    <label className={`block text-sm font-medium mb-2 flex items-center gap-1 ${error ? 'text-red-600' : 'text-gray-700'}`}>
      {label}
      {required && <span className="text-red-500">*</span>}
      {hint && (
        <Tooltip text={hint}>
          <HelpCircle className={`w-4 h-4 ${error ? 'text-red-400' : 'text-gray-400'}`} />
        </Tooltip>
      )}
    </label>
  );

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Container */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create Purchase Order</h2>
                <p className="text-sm text-blue-100">Add products and details for your purchase order</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50 px-6">
            <div className="flex overflow-x-auto scrollbar-hide -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap
                      transition-all duration-200
                      ${activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-blue-900 mb-1">Purchase Order Information</h3>
                        <p className="text-sm text-blue-700">
                          Fill in the vendor and store details. These fields are required to create a purchase order.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vendor Selection */}
                    <div>
                      <FieldLabel 
                        label="Vendor" 
                        required 
                        hint="Select the vendor/supplier who will fulfill this purchase order"
                        error={errors.vendorId}
                      />
                      <select
                        value={vendorId}
                        onChange={(e) => {
                          setVendorId(e.target.value);
                          setProductFilter('all');
                          if (errors.vendorId) {
                            const newErrors = { ...errors };
                            delete newErrors.vendorId;
                            setErrors(newErrors);
                          }
                        }}
                        className={`
                          w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                          ${errors.vendorId 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300 bg-white hover:border-gray-400'
                          }
                          disabled:bg-gray-100 disabled:cursor-not-allowed
                        `}
                        disabled={vendorsLoading}
                      >
                        <option value="">{vendorsLoading ? 'Loading vendors...' : 'Select vendor...'}</option>
                        {vendors.map(v => (
                          <option key={v._id} value={v._id}>
                            {v.name} - {v.company}
                          </option>
                        ))}
                      </select>
                      {errors.vendorId && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.vendorId}
                        </p>
                      )}
                      {selectedVendor && (
                        <div className="mt-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">{selectedVendor.company}</span>
                          </div>
                          {selectedVendor.email && (
                            <p className="text-sm text-gray-600 mt-1">{selectedVendor.email}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Store Selection */}
                    <div>
                      <FieldLabel 
                        label="Store" 
                        required 
                        hint="Select the store where goods will be received and stored"
                        error={errors.storeId}
                      />
                      <div className="flex gap-2">
                        <select
                          value={storeId}
                          onChange={(e) => {
                            setStoreId(e.target.value);
                            if (errors.storeId) {
                              const newErrors = { ...errors };
                              delete newErrors.storeId;
                              setErrors(newErrors);
                            }
                          }}
                          className={`
                            flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                            ${errors.storeId 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-gray-300 bg-white hover:border-gray-400'
                            }
                            disabled:bg-gray-100 disabled:cursor-not-allowed
                          `}
                          disabled={storesLoading}
                        >
                          <option value="">{storesLoading ? 'Loading stores...' : 'Select store...'}</option>
                          {stores.map((store: any) => (
                            <option key={store._id || store.id} value={store._id || store.id}>
                              {store.name} {store.code ? `(${store.code})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => refetchStores()}
                          className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                          title="Refresh stores"
                        >
                          <RefreshCw className={`w-5 h-5 text-gray-600 ${storesLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      {errors.storeId && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.storeId}
                        </p>
                      )}
                      {storesError && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Failed to load stores. Click refresh to try again.
                        </p>
                      )}
                      {!storesLoading && !storesError && stores.length === 0 && (
                        <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <p className="text-sm text-yellow-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            No stores found. Create a store in settings first.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Expected Delivery Date */}
                    <div>
                      <FieldLabel 
                        label="Expected Delivery Date" 
                        hint="The anticipated date when the vendor will deliver the goods"
                      />
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={expectedDate}
                          onChange={(e) => setExpectedDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Payment Terms */}
                    <div>
                      <FieldLabel 
                        label="Payment Terms" 
                        hint="Agreed payment terms with the vendor (e.g., Net 30, COD)"
                      />
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                      >
                        <option value="">Select payment terms...</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                        <option value="COD">Cash on Delivery</option>
                        <option value="Advance">Advance Payment</option>
                        <option value="On Receipt">Payment on Receipt</option>
                      </select>
                    </div>

                    {/* Shipping Cost */}
                    <div className="md:col-span-2">
                      <FieldLabel 
                        label="Shipping Cost" 
                        hint="Additional shipping or freight charges for this order"
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Tab */}
              {activeTab === 'items' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <ShoppingCart className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-green-900 mb-1">Add Products</h3>
                        <p className="text-sm text-green-700">
                          Search and add products to this purchase order. You can add products individually, scan barcodes, or bulk import via CSV.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hold Screen Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      {holdScreen ? (
                        <Lock className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Unlock className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <label className="text-sm font-semibold text-gray-900 cursor-pointer">
                          Hold Screen Mode
                        </label>
                        <p className="text-xs text-gray-600">
                          Keep search results open after adding products for faster bulk addition
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHoldScreen(!holdScreen)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${holdScreen ? 'bg-blue-600' : 'bg-gray-300'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${holdScreen ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>

                  {/* Product Search */}
                  <div className="relative">
                    <FieldLabel 
                      label="Search & Add Product" 
                      hint="Type to search products by name, SKU, or barcode. Click a product to add it to the order."
                    />
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={productSearchInput}
                        onChange={(e) => {
                          setProductSearchInput(e.target.value);
                        }}
                        placeholder="Type to search products (min 2 characters)..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                      {productSearchInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearchInput('');
                            setProductSearch('');
                            setSearchResults([]);
                            setShowSearchResults(false);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                        {productsLoading && (
                          <div className="p-4 text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                            <p className="text-sm text-gray-600 mt-2">Searching...</p>
                          </div>
                        )}
                        {!productsLoading && searchResults.map((product: any) => (
                          <button
                            key={product._id || product.id}
                            type="button"
                            onClick={() => handleProductClick(product)}
                            className="w-full p-4 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">{product.name}</span>
                                  {product.sku && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">SKU: {product.sku}</span>
                                  )}
                                </div>
                                {product.category && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {typeof product.category === 'object' ? product.category.name : product.category}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2">
                                  {product.price && (
                                    <span className="text-sm font-medium text-blue-600">
                                      {formatCurrency(product.price)}
                                    </span>
                                  )}
                                  {product.barcode && (
                                    <span className="text-xs text-gray-500">Barcode: {product.barcode}</span>
                                  )}
                                </div>
                              </div>
                              <Plus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {productSearchInput.length >= 2 && !productsLoading && searchResults.length === 0 && (
                      <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-600 text-center">
                          No products found for "{productSearchInput}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Product Filter Toggle */}
                  {vendorId && (
                    <div className="flex items-center gap-3 flex-wrap p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <label className="text-sm font-semibold text-gray-700">Product Filter:</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setProductFilter('all')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            productFilter === 'all'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          All Products
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductFilter('vendor')}
                          disabled={!selectedVendor || !selectedVendor.products || selectedVendor.products.length === 0}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            productFilter === 'vendor'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Vendor Products ({selectedVendor?.products?.length || 0})
                        </button>
                      </div>
                      {productFilter === 'vendor' && (!selectedVendor?.products || selectedVendor.products.length === 0) && (
                        <span className="text-xs text-yellow-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          No products assigned to this vendor. Showing all products.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-all hover:border-gray-400"
                    >
                      <ScanLine className="w-4 h-4" />
                      Scan Barcode
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkAdd(!showBulkAdd)}
                      className={`px-5 py-2.5 border-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                        showBulkAdd 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      Bulk Add
                    </button>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-all shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item Manually
                    </button>
                  </div>

                  {/* Bulk Add Section */}
                  {showBulkAdd && (
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <FieldLabel 
                          label="Bulk Add Products (CSV Format)" 
                          hint="Upload CSV file or paste CSV content. Format: SKU/Barcode, Quantity, UnitPrice (optional)"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowBulkAdd(false);
                            setBulkProducts('');
                            setBulkProductsFile(null);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBulkProductsFile(file);
                                setBulkProducts('');
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Or paste CSV content:</label>
                          <textarea
                            value={bulkProducts}
                            onChange={(e) => {
                              setBulkProducts(e.target.value);
                              setBulkProductsFile(null);
                            }}
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="SKU/Barcode, Quantity, UnitPrice&#10;PROD001, 10, 25.50&#10;PROD002, 5, 15.00"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleBulkAdd}
                            className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-all"
                          >
                            Process Bulk Add
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadCSVTemplate('purchase-order-products')}
                            className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download Template
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  {items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No items added yet</p>
                      <p className="text-sm text-gray-500 mt-1">Search and add products to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-all">
                          <div className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-12 md:col-span-4">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
                              <input
                                type="text"
                                value={item.productName || ''}
                                placeholder="Search and select product..."
                                readOnly
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                                  errors[`items.${index}.productId`] 
                                    ? 'border-red-500 bg-red-50' 
                                    : 'border-gray-300 bg-gray-50'
                                }`}
                              />
                              {errors[`items.${index}.productId`] && (
                                <p className="mt-1 text-xs text-red-600">{errors[`items.${index}.productId`]}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {item.sku && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">SKU: {item.sku}</span>
                                )}
                                {item.category && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                                )}
                              </div>
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                min="0.01"
                                step="0.01"
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                                  errors[`items.${index}.quantity`] 
                                    ? 'border-red-500 bg-red-50' 
                                    : 'border-gray-300'
                                }`}
                              />
                              {errors[`items.${index}.quantity`] && (
                                <p className="mt-1 text-xs text-red-600">{errors[`items.${index}.quantity`]}</p>
                              )}
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price *</label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm ${
                                    errors[`items.${index}.unitPrice`] 
                                      ? 'border-red-500 bg-red-50' 
                                      : 'border-gray-300'
                                  }`}
                                />
                              </div>
                              {errors[`items.${index}.unitPrice`] && (
                                <p className="mt-1 text-xs text-red-600">{errors[`items.${index}.unitPrice`]}</p>
                              )}
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Discount %</label>
                              <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="number"
                                  value={item.discount}
                                  onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                              <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900">
                                {formatCurrency(item.total)}
                              </div>
                            </div>
                            <div className="col-span-12 md:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <FileCheck className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-purple-900 mb-1">Order Summary</h3>
                        <p className="text-sm text-purple-700">
                          Review the totals and details before submitting the purchase order.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vendor:</span>
                          <span className="font-medium text-gray-900">
                            {selectedVendor ? `${selectedVendor.name} - ${selectedVendor.company}` : 'Not selected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Store:</span>
                          <span className="font-medium text-gray-900">
                            {stores.find((s: any) => (s._id || s.id) === storeId)?.name || 'Not selected'}
                          </span>
                        </div>
                        {expectedDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Expected Delivery:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(expectedDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {paymentTerms && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Terms:</span>
                            <span className="font-medium text-gray-900">{paymentTerms}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium text-gray-900">{formatCurrency(totalTax)}</span>
                        </div>
                        {shippingCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping:</span>
                            <span className="font-medium text-gray-900">{formatCurrency(shippingCost)}</span>
                          </div>
                        )}
                        <div className="pt-3 border-t border-gray-200 flex justify-between">
                          <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                          <span className="text-lg font-bold text-blue-600">{formatCurrency(grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Items Summary</h4>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{item.productName}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              x{item.quantity} @ {formatCurrency(item.unitPrice)}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <FileText className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-amber-900 mb-1">Additional Notes</h3>
                        <p className="text-sm text-amber-700">
                          Add any additional notes or special instructions for this purchase order.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <FieldLabel 
                      label="Notes" 
                      hint="Internal notes or special instructions for this purchase order"
                    />
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter any additional notes or instructions..."
                    />
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{items.length}</span> item(s) • Total: <span className="font-bold text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || items.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Create Purchase Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Component */}
      {alert.alert && (
        <SweetAlert
          type={alert.alert.type}
          title={alert.alert.title}
          message={alert.alert.message}
          show={alert.alert.show}
          onClose={alert.hideAlert}
          confirmText={alert.alert.confirmText}
          cancelText={alert.alert.cancelText}
          onConfirm={alert.alert.onConfirm}
          onCancel={alert.alert.onCancel}
          showCancel={alert.alert.showCancel}
          timer={alert.alert.timer}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScannerModal
          onClose={() => setShowBarcodeScanner(false)}
          onDetected={(code) => {
            handleBarcodeScan(code);
            setShowBarcodeScanner(false);
          }}
        />
      )}
    </>
  );
}
