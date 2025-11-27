import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient'; // Giả định hàm gọi API backend
import OrderCard from '../../components/order/OrderCard'; 
import StatusBadge from '../../components/order/StatusBadge'; // Cần import nếu dùng trong đây
import { Link } from 'react-router-dom'; // Hoặc next/link

function MyOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Logic Gọi API Backend
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Gọi API backend đã thiết lập: GET /api/orders/my-orders
                const response = await apiClient.get('/orders/my-orders'); 
                
                // Giả định API trả về data.data là mảng Orders
                setOrders(response.data.data); 
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
                setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại.");
                setLoading(false);
            }
        };

        fetchOrders();
    }, []); // Chỉ chạy một lần khi component mount

    // 2. Logic Hiển thị Trạng thái (Loading, Error, Empty)
    if (loading) {
        return <div className="text-center mt-8">Đang tải đơn hàng...</div>;
    }

    if (error) {
        return <div className="text-center mt-8 text-red-600">Lỗi: {error}</div>;
    }
    
    if (orders.length === 0) {
        return <div className="text-center mt-8 text-slate-500">Bạn chưa có đơn hàng nào.</div>;
    }

    // 3. Logic Render danh sách OrderCard
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">🛒 Lịch sử Đơn hàng của tôi</h1>
            <div className="space-y-4">
                {orders.map((order) => {
                    
                    // Logic nghiệp vụ: Tạo các nút Actions dựa trên Status
                    const actions = (
                        <div className="mt-4 flex justify-end space-x-2">
                            
                            {/* Nút Hủy (Chỉ hiện khi Pending/Processing) */}
                            {order.status === 'Pending' || order.status === 'Processing' ? (
                                <button className="text-sm px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50"
                                    onClick={() => alert(`Hủy đơn hàng ${order.id}`)}>
                                    Hủy Đơn
                                </button>
                            ) : null}
                            
                            {/* Nút Xác nhận (Chỉ hiện khi Delivered) */}
                            {order.status === 'Delivered' ? (
                                <button className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                    onClick={() => alert(`Xác nhận đã nhận ${order.id}`)}>
                                    Xác nhận Đã Nhận
                                </button>
                            ) : null}
                            
                            {/* Nút Xem Chi tiết (Luôn hiện) */}
                            <Link to={`/buyer/orders/${order.id}`} className="text-sm px-3 py-1 border rounded hover:bg-slate-100">
                                Xem Chi tiết
                            </Link>
                        </div>
                    );

                    return (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            actions={actions} 
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default MyOrdersPage;