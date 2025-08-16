import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type KitOrder = Database['public']['Tables']['kit_orders']['Row'];
type KitItem = Database['public']['Tables']['kit_items']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export class KitOrdersService {
  // Get all kit items
  static async getKitItems() {
    try {
      const { data, error } = await supabase
        .from('kit_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get kit items',
        data: [],
      };
    }
  }

  // Create new order
  static async createOrder(orderData: {
    userId: string;
    items: Array<{ kitItemId: string; quantity: number }>;
    specialRequests?: string;
    shippingAddress?: any;
  }) {
    try {
      // Calculate total amount
      let totalAmount = 0;
      const orderItems = [];

      for (const item of orderData.items) {
        const { data: kitItem } = await supabase
          .from('kit_items')
          .select('price')
          .eq('id', item.kitItemId)
          .single();

        if (kitItem) {
          const itemTotal = kitItem.price * item.quantity;
          totalAmount += itemTotal;
          orderItems.push({
            kit_item_id: item.kitItemId,
            quantity: item.quantity,
            unit_price: kitItem.price,
            total_price: itemTotal,
          });
        }
      }

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('kit_orders')
        .insert({
          user_id: orderData.userId,
          total_amount: totalAmount,
          special_requests: orderData.specialRequests,
          shipping_address: orderData.shippingAddress,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(orderError.message);
      }

      // Add order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: order.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId);

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      // Create notification for admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'announcement' as const,
          title: 'New Kit Order Received',
          message: `Order #${order.id.slice(-8)} has been placed and needs processing.`,
          data: { order_id: order.id },
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return { success: true, data: order };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  }

  // Get user's orders
  static async getUserOrders(userId: string) {
    try {
      const { data, error } = await supabase
        .from('kit_orders')
        .select(`
          *,
          order_items(
            quantity,
            unit_price,
            total_price,
            kit_items(name, description)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user orders',
        data: [],
      };
    }
  }

  // Get all orders (admin only)
  static async getAllOrders(status?: string) {
    try {
      let query = supabase
        .from('kit_orders')
        .select(`
          *,
          profiles(full_name, phone),
          order_items(
            quantity,
            unit_price,
            total_price,
            kit_items(name, description)
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get orders',
        data: [],
      };
    }
  }

  // Update order status (admin only)
  static async updateOrderStatus(
    orderId: string,
    status: Database['public']['Enums']['order_status'],
    trackingNumber?: string
  ) {
    try {
      const updateData: any = { status };
      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      const { data, error } = await supabase
        .from('kit_orders')
        .update(updateData)
        .eq('id', orderId)
        .select(`
          *,
          profiles(full_name)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Create notification for student
      const statusMessages = {
        processing: 'Your order is being processed.',
        shipped: `Your order has been shipped${trackingNumber ? ` with tracking number ${trackingNumber}` : ''}.`,
        delivered: 'Your order has been delivered!',
        cancelled: 'Your order has been cancelled.',
      };

      if (status in statusMessages) {
        await supabase
          .from('notifications')
          .insert({
            user_id: data.user_id,
            type: 'announcement',
            title: 'Order Status Update',
            message: statusMessages[status as keyof typeof statusMessages],
            data: { order_id: orderId, status, tracking_number: trackingNumber },
          });
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order status',
      };
    }
  }

  // Get order details
  static async getOrderDetails(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('kit_orders')
        .select(`
          *,
          profiles(full_name, phone, location),
          order_items(
            quantity,
            unit_price,
            total_price,
            kit_items(name, description, category)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get order details',
      };
    }
  }

  // Update kit item stock (admin only)
  static async updateKitItemStock(itemId: string, stockQuantity: number) {
    try {
      const { data, error } = await supabase
        .from('kit_items')
        .update({
          stock_quantity: stockQuantity,
          in_stock: stockQuantity > 0,
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update stock',
      };
    }
  }

  // Create new kit item (admin only)
  static async createKitItem(itemData: Database['public']['Tables']['kit_items']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('kit_items')
        .insert(itemData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create kit item',
      };
    }
  }

  // Update kit item (admin only)
  static async updateKitItem(
    itemId: string,
    updates: Database['public']['Tables']['kit_items']['Update']
  ) {
    try {
      const { data, error } = await supabase
        .from('kit_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update kit item',
      };
    }
  }

  // Delete kit item (admin only)
  static async deleteKitItem(itemId: string) {
    try {
      const { error } = await supabase
        .from('kit_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete kit item',
      };
    }
  }
}