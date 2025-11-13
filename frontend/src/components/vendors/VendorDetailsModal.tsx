import { X, Building2, Mail, Phone, MapPin, Edit } from 'lucide-react';
import type { Vendor } from '@/types/vendor.types';

interface VendorDetailsModalProps {
  vendor: Vendor;
  onClose: () => void;
  onEdit: () => void;
}

export default function VendorDetailsModal({
  vendor,
  onClose,
  onEdit,
}: VendorDetailsModalProps) {
  const creditLimit = vendor.creditLimit ?? 0;
  const creditUsed = vendor.currentBalance ?? 0;
  const creditAvailable = Math.max(creditLimit - creditUsed, 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{vendor.name}</h2>
              <p className="text-sm text-gray-600">{vendor.company}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Purchased</p>
              <p className="text-2xl font-bold">
                ${vendor.totalPurchased.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold">{vendor.totalOrders}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Balance</p>
              <p className="text-2xl font-bold">
                ${vendor.currentBalance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Contact Information</h3>
            {vendor.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{vendor.email}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{vendor.phone}</span>
              </div>
            )}
            {vendor.address &&
              (vendor.address.street || vendor.address.city) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    {vendor.address.street && <p>{vendor.address.street}</p>}
                    <p>
                      {vendor.address.city}
                      {vendor.address.state && `, ${vendor.address.state}`}
                      {vendor.address.zipCode && ` ${vendor.address.zipCode}`}
                    </p>
                    {vendor.address.country && <p>{vendor.address.country}</p>}
                  </div>
                </div>
              )}
          </div>

          {(vendor.paymentTerms || creditLimit > 0) && (
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Payment Information</h3>
              {vendor.paymentTerms && (
                <p>
                  <strong>Terms:</strong> {vendor.paymentTerms}
                </p>
              )}
              {creditLimit > 0 && (
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded bg-blue-50 p-3">
                    <p className="text-gray-500">Credit Limit</p>
                    <p className="text-lg font-semibold text-blue-700">
                      ${creditLimit.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded bg-amber-50 p-3">
                    <p className="text-gray-500">Outstanding</p>
                    <p className="text-lg font-semibold text-amber-600">
                      ${creditUsed.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded bg-emerald-50 p-3">
                    <p className="text-gray-500">Available</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      ${creditAvailable.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {vendor.notes && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-gray-700">{vendor.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
