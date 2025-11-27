import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';

export default function BuyerOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' means all statuses
  const [minItems, setMinItems] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch current buyer's orders only via /api/orders/my-orders
        const res = await fetch('/api/orders/my-orders', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await res.json();
        console.log('Raw API response:', result);
        if (!res.ok) throw new Error(result?.message || 'Failed to fetch orders');
        if (mounted) {
          // Backend returns { success, count, orders }
          let ordersData = result.orders || [];
          
          // Apply client-side filters if needed
          let filtered = ordersData;
          if (statusFilter) {
            filtered = filtered.filter(o => (o.Status || o.status) === statusFilter);
          }
          if (minItems > 0) {
            filtered = filtered.filter(o => (o.ItemCount || o.itemCount || 0) >= minItems);
          }
          
          console.log('Parsed orders data:', filtered);
          console.log('First order sample:', filtered[0]);
          setOrders(filtered);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
        if (mounted) setError(err.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchOrders();
    return () => { mounted = false; };
  }, [statusFilter, minItems]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (val) => {
    const num = Number(val);
    return Number.isFinite(num) ? num.toFixed(3) : '0.000';
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s === 'processing') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'dispatched' || s === 'delivering') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (s === 'completed' || s === 'delivered') return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto p-6 text-black">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivering">Delivering</option>
                <option value="Delivered">Delivered</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Items</label>
              <input
                type="number"
                min="0"
                value={minItems}
                onChange={(e) => setMinItems(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Loading your orders...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 mb-4">You have no orders yet.</p>
            <button
              onClick={() => navigate('/home')}
              className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-md font-semibold"
            >
              Start Shopping
            </button>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.ID || order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Order ID</div>
                    <div className="font-semibold text-lg">{order.ID || order.id}</div>
                  </div>
                  <div className={`mt-2 md:mt-0 inline-block px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(order.Status || order.status)}`}>
                    {order.Status || order.status || 'Pending'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Date</div>
                    <div className="font-medium">{formatDate(order.OrderTime || order.Time || order.time || order.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total</div>
                    <div className="font-medium text-red-600">{formatAmount(order.Total || order.total)}₫</div>
                  </div>
                  {/* <div>
                    <div className="text-gray-500">Buyer</div>
                    <div className="font-medium">{order.Buyer || order.buyer || 'N/A'}</div>
                  </div> */}
                  <div>
                    <div className="text-gray-500">Items</div>
                    <div className="font-medium">{order.count}</div>
                  </div>
                </div>

                {/* User Details Section */}
                {(order.Username || order.Email) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Buyer Information</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {order.Username && (
                        <div>
                          <span className="text-gray-500">Username: </span>
                          <span className="font-medium">{order.Username}</span>
                        </div>
                      )}
                      {order.Email && (
                        <div>
                          <span className="text-gray-500">Email: </span>
                          <span className="font-medium">{order.Email}</span>
                        </div>
                      )}
                      {order.Gender && (
                        <div>
                          <span className="text-gray-500">Gender: </span>
                          <span className="font-medium">{order.Gender}</span>
                        </div>
                      )}
                      {order.Age && (
                        <div>
                          <span className="text-gray-500">Age: </span>
                          <span className="font-medium">{order.Age}</span>
                        </div>
                      )}
                      {order.DateOfBirth && (
                        <div>
                          <span className="text-gray-500">DOB: </span>
                          <span className="font-medium">{formatDate(order.DateOfBirth)}</span>
                        </div>
                      )}
                      {order.UserAddress && (
                        <div>
                          <span className="text-gray-500">User Address: </span>
                          <span className="font-medium">{order.UserAddress}</span>
                        </div>
                      )}
                      {order.Rank && (
                        <div>
                          <span className="text-gray-500">Rank: </span>
                          <span className="font-medium text-yellow-600">{order.Rank}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500 mb-2">Items</div>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.name || item.variationname || 'Item'} {item.color ? `(${item.color})` : ''} x {item.quantity}</span>
                          <span className="font-medium">{formatAmount(item.price * item.quantity) + 16500}₫</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {order.shipper && (
                  <div className="mt-4 pt-4 border-t text-sm">
                    <div className="text-gray-500">Shipper</div>
                    <div className="font-medium">{order.shipper.name || order.shipper.id}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
