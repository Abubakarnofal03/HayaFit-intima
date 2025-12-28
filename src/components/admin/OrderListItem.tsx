import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/currency";
import { format } from "date-fns";

interface OrderListItemProps {
    order: {
        id: string;
        order_number: number;
        status: string;
        created_at: string;
        first_name: string;
        last_name: string;
        phone: string;
        shipping_city: string;
        total_amount: number;
    };
    isSelected: boolean;
    onSelect: (orderId: string) => void;
    onStatusChange: (orderId: string, status: string) => void;
    onClick: (orderId: string) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30';
        case 'processing':
            return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
        case 'shipped':
            return 'bg-purple-500/10 text-purple-700 border-purple-500/30';
        case 'delivered':
            return 'bg-green-500/10 text-green-700 border-green-500/30';
        case 'cancelled':
            return 'bg-red-500/10 text-red-700 border-red-500/30';
        default:
            return 'bg-gray-500/10 text-gray-700 border-gray-500/30';
    }
};

export const OrderListItem = ({
    order,
    isSelected,
    onSelect,
    onStatusChange,
    onClick,
}: OrderListItemProps) => {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                    {/* Checkbox */}
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelect(order.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 flex-shrink-0"
                    />

                    {/* Order Info - Click to expand */}
                    <div
                        className="flex-1 min-w-0 space-y-3"
                        onClick={() => onClick(order.id)}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            {/* Left side - Order details */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-base">
                                        #{order.order_number}
                                    </span>
                                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </Badge>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    {order.first_name} {order.last_name}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span>{order.phone}</span>
                                    <span>•</span>
                                    <span>{order.shipping_city}</span>
                                    <span>•</span>
                                    <span>{format(new Date(order.created_at), 'PPp')}</span>
                                </div>
                            </div>

                            {/* Right side - Total and status */}
                            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                <span className="font-bold text-lg text-primary">
                                    {formatPrice(order.total_amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status dropdown */}
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Select
                            value={order.status}
                            onValueChange={(status) => onStatusChange(order.id, status)}
                        >
                            <SelectTrigger className="w-[140px] sm:w-[150px] h-10 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </Card>
    );
};
