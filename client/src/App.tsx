/**
 * ShopMart - App Router
 * Design: 活力促銷電商風 - 紅白主色調
 * Routes: 前台購物平台 + 後台管理儀表板
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

import { LanguageProvider } from "./contexts/LanguageContext";

// Frontend pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderHistory from "./pages/OrderHistory";
import NFTMarketplace from "./pages/NFTMarketplace";
import NFTDetail from "./pages/NFTDetail";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNFTSettings from "./pages/admin/AdminNFTSettings";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Frontend routes */}
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/login" component={Login} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={OrderHistory} />
      <Route path="/orders/confirmation" component={OrderConfirmation} />
      <Route path="/nft-marketplace" component={NFTMarketplace} />
      <Route path="/nft/:contractAddress/:tokenId" component={NFTDetail} />

      {/* Admin routes */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/nft-settings" component={AdminNFTSettings} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <LanguageProvider>
          <>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
