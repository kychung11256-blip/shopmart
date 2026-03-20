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

// Frontend pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

function Router() {
  return (
    <Switch>
      {/* Frontend routes */}
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/login" component={Login} />

      {/* Admin routes */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/settings" component={AdminSettings} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
