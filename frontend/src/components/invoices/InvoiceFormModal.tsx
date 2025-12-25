import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { customersService } from '@/services/customers.service';
import { productsService } from '@/services/products.service';
import { invoiceService } from '@/services/invoice.service';
import type { DocumentType, Invoice } from '@/types/invoice.types';
import toast from 'react-hot-toast';

interface InvoiceFormModalProps {
  onClose: () => void;
  invoice?: Invoice;
}

interface LineItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

const createInitialFormState = (invoice?: Invoice) => {
  if (invoice) {
    return {
      type: invoice.type,
      customerId: invoice.to.customerId || '',
      date: new Date(invoice.date).toISOString().split('T')[0],
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      notes: invoice.notes || '',
      terms: invoice.terms || '',
    };
  }
  return {
    type: 'sale_invoice' as DocumentType,
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    terms: '',
  };
};

const createEmptyLineItem = (): LineItem => ({
  productId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  taxRate: 0,
});

export default function InvoiceFormModal({ onClose, invoice }: InvoiceFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(() => createInitialFormState(invoice));

  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (invoice && invoice.items.length > 0) {
      return invoice.items.map((item) => ({
        productId: item.productId || '',
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: item.taxRate || 0,
      }));
    }
    return [createEmptyLineItem()];
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersService.getAll({}),
  });
  const customers = customersData?.customers || [];

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'invoice-select'],
    queryFn: () => productsService.getAll({ limit: 100, page: 1, isActive: true }),
  });
  const products = productsData?.products || [];

  const resetForm = () => {
    setFormData(createInitialFormState());
    setLineItems([createEmptyLineItem()]);
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => invoiceService.create(payload),
    onSuccess: () => {
      toast.success('Invoice created successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      const details = error?.response?.data?.error;
      const detailMessage = Array.isArray(details?.details) ? details.details[0]?.message : undefined;
      const message = detailMessage || details?.message || error?.response?.data?.message || 'Failed to create invoice';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => invoiceService.update(invoice!.id, payload),
    onSuccess: () => {
      toast.success('Invoice updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
    onError: (error: any) => {
      const details = error?.response?.data?.error;
      const detailMessage = Array.isArray(details?.details) ? details.details[0]?.message : undefined;
      const message = detailMessage || details?.message || error?.response?.data?.message || 'Failed to update invoice';
      toast.error(message);
    },
  });

  const handleAddLineItem = () => {
    setLineItems([...lineItems, createEmptyLineItem()]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: any
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill from product if product selected
    if (field === 'productId' && value) {
      const product = products.find((p) => p._id === value);
      if (product) {
        updated[index].description = product.name;
        updated[index].unitPrice = product.price;
        updated[index].taxRate = product.taxRate || 0;
      }
    }

    setLineItems(updated);
  };

  const calculateLineTotal = (item: LineItem) => {
    const quantity = item.quantity > 0 ? item.quantity : 0;
    const unitPrice = item.unitPrice >= 0 ? item.unitPrice : 0;
    const lineSubtotal = quantity * unitPrice;
    const discountValue = Math.min(item.discount || 0, lineSubtotal);
    const taxableAmount = Math.max(lineSubtotal - discountValue, 0);
    const taxRate = item.taxRate >= 0 ? item.taxRate : 0;
    const taxAmount = (taxableAmount * taxRate) / 100;
    return taxableAmount + taxAmount;
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    const selectedCustomer = customers.find((customer) => customer._id === formData.customerId);
    if (!selectedCustomer) {
      toast.error('Selected customer could not be found');
      return;
    }

    const validItems = lineItems.filter((item) => item.productId);
    if (validItems.length === 0) {
      toast.error('Please add at least one product line item');
      return;
    }

    if (validItems.some((item) => item.quantity <= 0)) {
      toast.error('Line item quantity must be greater than 0');
      return;
    }

    let subtotalAccumulator = 0;
    let taxAccumulator = 0;
    let discountAccumulator = 0;

    const itemsPayload = validItems.map((item) => {
      const product = products.find((p) => p._id === item.productId);
      const quantity = item.quantity > 0 ? item.quantity : 0;
      const unitPrice = item.unitPrice >= 0 ? item.unitPrice : 0;
      const lineSubtotal = quantity * unitPrice;
      const discountValue = Math.min(item.discount || 0, lineSubtotal); // Assuming discount is a fixed amount or percentage already applied
      const taxableAmount = Math.max(lineSubtotal - discountValue, 0);
      const taxRate = item.taxRate >= 0 ? item.taxRate : 0;
      const taxAmount = Number(((taxableAmount * taxRate) / 100).toFixed(2));

      subtotalAccumulator += lineSubtotal;
      discountAccumulator += discountValue;
      taxAccumulator += taxAmount;

      return {
        productId: item.productId,
        productName: product?.name || item.description,
        description: item.description,
        quantity,
        unit: product?.unit || 'pcs',
        unitPrice,
        discount: Number(discountValue.toFixed(2)),
        discountType: 'fixed' as const, // Assuming fixed discount for simplicity
        taxRate,
        taxAmount,
        subtotal: Number(lineSubtotal.toFixed(2)),
        total: Number((taxableAmount + taxAmount).toFixed(2)),
      };
    });

    const subtotal = Number(subtotalAccumulator.toFixed(2));
    const totalDiscount = Number(discountAccumulator.toFixed(2));
    const totalTax = Number(taxAccumulator.toFixed(2));
    const totalDue = Number((subtotal - totalDiscount + totalTax).toFixed(2));

    const customerAddress = selectedCustomer.address || {};
    const toAddress = {
      name: selectedCustomer.name || 'Customer',
      line1: customerAddress.street || 'Address not provided',
      line2: '',
      city: customerAddress.city || 'Unknown City',
      state: customerAddress.state || 'Unknown State',
      zipCode: customerAddress.zipCode || '00000',
      country: customerAddress.country || 'Unknown Country',
      phone: selectedCustomer.phone,
      email: selectedCustomer.email,
    };

    const payload = {
      type: formData.type,
      status: 'draft', // Default status for new invoices
      date: new Date(formData.date).toISOString(),
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      notes: formData.notes || undefined,
      terms: formData.terms || undefined,
      subtotal,
      totalDiscount,
      totalTax,
      total: totalDue,
      amountPaid: invoice?.amountPaid || 0, // Keep existing amountPaid if editing
      amountDue: totalDue - (invoice?.amountPaid || 0), // Recalculate amountDue
      from: {
        businessName: 'Main Store',
        address: {
          name: 'Main Store',
          line1: '123 Main Street',
          line2: '',
          city: 'Unknown City',
          state: 'Unknown State',
          zipCode: '00000',
          country: 'Unknown Country',
        },
      },
      to: {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        address: toAddress,
      },
      items: itemsPayload,
    };

    if (invoice) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId);
    const newItems = [...lineItems];
    if (product) {
      newItems[index] = {
        ...newItems[index],
        productId,
        description: product.name,
        unitPrice: product.price,
        taxRate: product.taxRate || 0,
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        productId,
        description: '',
        unitPrice: 0,
        taxRate: 0,
      };
    }
    setLineItems(newItems);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as DocumentType })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="sale_invoice">Invoice</option>
                <option value="quotation">Quotation</option>
                <option value="proforma_invoice">Proforma Invoice</option>
                <option value="credit_note">Credit Note</option>
                <option value="receipt">Receipt</option>
                <option value="purchase_order">Purchase Order</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
              <button
                type="button"
                onClick={() => setLineItems([...lineItems, createEmptyLineItem()])}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-lg"
                >
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Product
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      disabled={isSubmitting}
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(index, 'description', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Item description"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(index, 'quantity', parseFloat(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="1"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateLineItem(index, 'unitPrice', parseFloat(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Disc %
                    </label>
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) =>
                        updateLineItem(index, 'discount', parseFloat(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="0"
                      max="100"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tax %
                    </label>
                    <input
                      type="number"
                      value={item.taxRate}
                      onChange={(e) =>
                        updateLineItem(index, 'taxRate', parseFloat(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="0"
                      max="100"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-span-1 pt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={lineItems.length === 1 || isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Notes for the customer..."
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Payment terms, delivery details..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {invoice ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                invoice ? 'Update Invoice' : 'Create Invoice'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
