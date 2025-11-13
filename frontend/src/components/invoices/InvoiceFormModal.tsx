import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2 } from 'lucide-react';
import { customersService } from '@/services/customers.service';
import { productsService } from '@/services/products.service';
import { invoiceService } from '@/services/invoice.service';
import type { DocumentType } from '@/types/invoice.types';
import toast from 'react-hot-toast';

interface InvoiceFormModalProps {
  onClose: () => void;
}

interface LineItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

const createInitialFormState = () => ({
  type: 'sale_invoice' as DocumentType,
  customerId: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  notes: '',
  terms: '',
});

const createEmptyLineItem = (): LineItem => ({
  productId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  taxRate: 0,
});

export default function InvoiceFormModal({ onClose }: InvoiceFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(createInitialFormState);

  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem()]);

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

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (createMutation.isPending) {
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
      const discountValue = Math.min(item.discount || 0, lineSubtotal);
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
        discountType: 'fixed' as const,
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

    const invoicePayload = {
      type: formData.type,
      status: 'draft',
      date: new Date(formData.date).toISOString(),
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      notes: formData.notes || undefined,
      terms: formData.terms || undefined,
      subtotal,
      totalDiscount,
      totalTax,
      total: totalDue,
      amountPaid: 0,
      amountDue: totalDue,
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

    try {
      await createMutation.mutateAsync(invoicePayload);
    } catch (err) {
      // Errors handled in mutation onError
    }
  };

  const resetForm = () => {
    setFormData(createInitialFormState());
    setLineItems([createEmptyLineItem()]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Create Invoice</h2>
          <button
            onClick={() => {
              if (createMutation.isPending) return;
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Invoice Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as DocumentType,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="sale_invoice">Invoice</option>
                <option value="quotation">Quotation</option>
                <option value="proforma_invoice">Proforma Invoice</option>
                <option value="credit_note">Credit Note</option>
                <option value="receipt">Receipt</option>
              </select>
            </div>
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
              />
            </div>
          </div>

          {/* Customer Selection */}
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
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Line Items
              </h3>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>

            {/* Line item headers */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 mb-2 bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-600 uppercase rounded-lg">
              <span className="col-span-3">Product</span>
              <span className="col-span-3">Description</span>
              <span className="col-span-1 text-right">Qty</span>
              <span className="col-span-2 text-right">Unit Price</span>
              <span className="col-span-1 text-right">Discount</span>
              <span className="col-span-1 text-right">Tax %</span>
              <span className="col-span-1 text-right">Total</span>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 p-3 border border-gray-200 rounded-lg"
                >
                  {/* Product Select */}
                  <div className="col-span-3">
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        handleLineItemChange(index, 'productId', e.target.value)
                      }
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Product</option>
                      {productsLoading && <option disabled>Loading products...</option>}
                      {!productsLoading && products.length === 0 && (
                        <option disabled>No products available</option>
                      )}
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder="Description"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          'quantity',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Qty"
                      min="1"
                      step="0.01"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          'unitPrice',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Discount */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          'discount',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Disc"
                      min="0"
                      step="0.01"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tax */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={item.taxRate}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          'taxRate',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Tax %"
                      min="0"
                      step="0.01"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Total & Delete */}
                  <div className="col-span-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      ${calculateLineTotal(item).toFixed(2)}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64 border-t-2 border-gray-300 pt-4">
              <div className="flex items-center justify-between text-xl font-bold text-gray-900">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Internal notes..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) =>
                  setFormData({ ...formData, terms: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Payment terms..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                if (createMutation.isPending) return;
                resetForm();
                onClose();
              }}
              disabled={createMutation.isPending}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
