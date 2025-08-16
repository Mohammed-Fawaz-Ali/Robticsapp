import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Plus, Minus, ShoppingCart, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface KitItem {
  id: string;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
  category: string;
}

interface OrderItem extends KitItem {
  quantity: number;
}

interface PastOrder {
  id: string;
  date: string;
  status: 'delivered' | 'processing' | 'cancelled';
  items: { name: string; quantity: number }[];
  total: number;
}

const KitItemCard: React.FC<{
  item: KitItem;
  quantity: number;
  onQuantityChange: (id: string, quantity: number) => void;
}> = ({ item, quantity, onQuantityChange }) => (
  <View style={styles.kitItemCard}>
    <View style={styles.kitItemInfo}>
      <Text style={styles.kitItemName}>{item.name}</Text>
      <Text style={styles.kitItemDescription}>{item.description}</Text>
      <View style={styles.kitItemMeta}>
        <Text style={styles.kitItemPrice}>${item.price.toFixed(2)}</Text>
        <View style={[styles.stockStatus, item.inStock ? styles.inStock : styles.outOfStock]}>
          <Text style={[styles.stockStatusText, item.inStock ? styles.inStockText : styles.outOfStockText]}>
            {item.inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
      </View>
    </View>
    
    {item.inStock && (
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onQuantityChange(item.id, Math.max(0, quantity - 1))}
        >
          <Minus size={16} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onQuantityChange(item.id, quantity + 1)}
        >
          <Plus size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const OrderHistoryCard: React.FC<{ order: PastOrder }> = ({ order }) => {
  const getStatusColor = () => {
    switch (order.status) {
      case 'delivered':
        return '#10B981';
      case 'processing':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (order.status) {
      case 'delivered':
        return <CheckCircle size={16} color="#10B981" />;
      case 'processing':
        return <Clock size={16} color="#F59E0B" />;
      case 'cancelled':
        return <AlertCircle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{order.id}</Text>
        <View style={styles.orderStatus}>
          {getStatusIcon()}
          <Text style={[styles.orderStatusText, { color: getStatusColor() }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.orderDate}>{order.date}</Text>
      <View style={styles.orderItems}>
        {order.items.map((item, index) => (
          <Text key={index} style={styles.orderItemText}>
            {item.quantity}× {item.name}
          </Text>
        ))}
      </View>
      <Text style={styles.orderTotal}>Total: ${order.total.toFixed(2)}</Text>
    </View>
  );
};

export default function KitOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'order' | 'history'>('order');
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [specialRequest, setSpecialRequest] = useState('');

  const kitItems: KitItem[] = [
    {
      id: '1',
      name: 'Student Notebook Set',
      description: 'Set of 3 lined notebooks with covers',
      price: 12.99,
      inStock: true,
      category: 'Stationery',
    },
    {
      id: '2',
      name: 'Science Kit - Level 3',
      description: 'Complete lab materials for Level 3 experiments',
      price: 45.99,
      inStock: true,
      category: 'Science',
    },
    {
      id: '3',
      name: 'Graphing Calculator',
      description: 'TI-84 Plus CE for advanced mathematics',
      price: 89.99,
      inStock: false,
      category: 'Mathematics',
    },
    {
      id: '4',
      name: 'Art Supply Kit',
      description: 'Colored pencils, markers, and sketching paper',
      price: 24.99,
      inStock: true,
      category: 'Art',
    },
    {
      id: '5',
      name: 'Programming Books Set',
      description: 'Essential programming textbooks for Level 4+',
      price: 67.50,
      inStock: true,
      category: 'Programming',
    },
  ];

  const pastOrders: PastOrder[] = [
    {
      id: '2024001',
      date: 'January 15, 2024',
      status: 'delivered',
      items: [
        { name: 'Student Notebook Set', quantity: 2 },
        { name: 'Art Supply Kit', quantity: 1 },
      ],
      total: 50.97,
    },
    {
      id: '2024002',
      date: 'February 3, 2024',
      status: 'processing',
      items: [
        { name: 'Science Kit - Level 2', quantity: 1 },
      ],
      total: 39.99,
    },
  ];

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (quantity === 0) {
        delete newCart[itemId];
      } else {
        newCart[itemId] = quantity;
      }
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = kitItems.find(item => item.id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  const handleSubmitOrder = () => {
    const cartItems = Object.entries(cart).length;
    if (cartItems === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before submitting.');
      return;
    }

    Alert.alert(
      'Order Submitted',
      'Your order has been submitted successfully! You will receive a confirmation email shortly.',
      [{ text: 'OK', onPress: () => setCart({}) }]
    );
  };

  const cartItemsCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kit & Orders</Text>
        {cartItemsCount > 0 && (
          <View style={styles.cartBadge}>
            <ShoppingCart size={20} color="#3B82F6" />
            <View style={styles.cartBadgeNumber}>
              <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'order' && styles.activeTab]}
          onPress={() => setActiveTab('order')}
        >
          <Text style={[styles.tabText, activeTab === 'order' && styles.activeTabText]}>
            Order Materials
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Order History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {activeTab === 'order' ? (
          <>
            {/* Available Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Materials</Text>
              {kitItems.map((item) => (
                <KitItemCard
                  key={item.id}
                  item={item}
                  quantity={cart[item.id] || 0}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </View>

            {/* Special Requests */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Requests</Text>
              <TextInput
                style={styles.specialRequestInput}
                placeholder="Any special requests or notes for your order..."
                multiline
                numberOfLines={4}
                value={specialRequest}
                onChangeText={setSpecialRequest}
                textAlignVertical="top"
              />
            </View>

            {/* Cart Summary */}
            {Object.keys(cart).length > 0 && (
              <View style={styles.cartSummary}>
                <Text style={styles.cartSummaryTitle}>Order Summary</Text>
                {Object.entries(cart).map(([itemId, quantity]) => {
                  const item = kitItems.find(item => item.id === itemId);
                  if (!item) return null;
                  return (
                    <View key={itemId} style={styles.cartSummaryItem}>
                      <Text style={styles.cartSummaryItemName}>
                        {quantity}× {item.name}
                      </Text>
                      <Text style={styles.cartSummaryItemPrice}>
                        ${(item.price * quantity).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.cartSummaryTotal}>
                  <Text style={styles.cartSummaryTotalText}>
                    Total: ${calculateTotal().toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmitOrder}>
                  <Package size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Order</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Order History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order History</Text>
              {pastOrders.map((order) => (
                <OrderHistoryCard key={order.id} order={order} />
              ))}
              {pastOrders.length === 0 && (
                <View style={styles.emptyState}>
                  <Package size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateTitle}>No orders yet</Text>
                  <Text style={styles.emptyStateMessage}>
                    Your order history will appear here once you place your first order.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    flex: 1,
  },
  cartBadge: {
    position: 'relative',
  },
  cartBadgeNumber: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 16,
  },
  kitItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  kitItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  kitItemName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  kitItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  kitItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kitItemPrice: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
  },
  stockStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inStock: {
    backgroundColor: '#F0FDF4',
  },
  outOfStock: {
    backgroundColor: '#FEF2F2',
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inStockText: {
    color: '#10B981',
  },
  outOfStockText: {
    color: '#EF4444',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  specialRequestInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  cartSummary: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartSummaryTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 16,
  },
  cartSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cartSummaryItemName: {
    fontSize: 16,
    color: '#1F2937',
  },
  cartSummaryItemPrice: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  cartSummaryTotal: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  cartSummaryTotalText: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});