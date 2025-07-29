import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import AnimatedHero from './AnimatedHero';
import { 
  BarChart3, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  RefreshCw,
  Play,
  Download,
  Activity,
  Search,
  Filter,
  Star,
  Calendar,
  MoreHorizontal,
  Home,
  Settings,
  Users,
  Zap,
  ShoppingBag,
  Package,
  ShoppingCart,
  Video,
  Link,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sample data for reviews
  const reviews = [
    {
      id: 1,
      content: "Great service and friendly staff! Will definitely come back.",
      platform: "Google",
      status: "Published",
      confidence: 95,
      date: "2025-01-28",
      rating: 5,
      customerName: "Sarah Johnson"
    },
    {
      id: 2,
      content: "Food was okay but service was slow.",
      platform: "Yelp",
      status: "Pending",
      confidence: 78,
      date: "2025-01-27",
      rating: 3,
      customerName: "Mike Chen"
    },
    {
      id: 3,
      content: "Absolutely amazing experience! The best restaurant in town.",
      platform: "TripAdvisor",
      status: "Published",
      confidence: 92,
      date: "2025-01-26",
      rating: 5,
      customerName: "Emily Davis"
    },
    {
      id: 4,
      content: "Disappointed with the quality. Expected much better.",
      platform: "Google",
      status: "Draft",
      confidence: 65,
      date: "2025-01-25",
      rating: 2,
      customerName: "Robert Kim"
    }
  ];

  // Sample data for integrations with ocean theme
  const integrations = [
    {
      id: 'shopify',
      name: 'Shopify',
      icon: ShoppingBag,
      connected: true,
      reviewsCount: 43,
      lastSync: '2 mins ago',
      status: 'Active',
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
      iconColor: 'text-emerald-600'
    },
    {
      id: 'etsy',
      name: 'Etsy',
      icon: Package,
      connected: true,
      reviewsCount: 28,
      lastSync: '5 mins ago',
      status: 'Active',
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200',
      iconColor: 'text-orange-600'
    },
    {
      id: 'amazon',
      name: 'Amazon',
      icon: ShoppingCart,
      connected: false,
      reviewsCount: 0,
      lastSync: 'Never',
      status: 'Disconnected',
      color: 'text-slate-500',
      bgColor: 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200',
      iconColor: 'text-slate-400'
    },
    {
      id: 'tiktok',
      name: 'TikTok Shop',
      icon: Video,
      connected: true,
      reviewsCount: 19,
      lastSync: '1 hour ago',
      status: 'Warning',
      color: 'text-yellow-600',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200',
      iconColor: 'text-yellow-600'
    }
  ];

  const navigationItems = [
    { icon: Home, label: 'Overview', active: true },
    { icon: MessageSquare, label: 'Reviews' },
    { icon: BarChart3, label: 'Analytics' },
    { icon: Users, label: 'Customers' },
    { icon: Link, label: 'Integrations' },
    { icon: Settings, label: 'Settings' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Draft': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-emerald-600';
    if (confidence >= 70) return 'text-amber-600';
    return 'text-rose-600';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
      />
    ));
  };

  const getIntegrationStatusIcon = (integration) => {
    if (!integration.connected) {
      return <AlertCircle className="w-4 h-4 text-rose-500" />;
    }
    if (integration.status === 'Warning') {
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="min-h-screen">
      {/* Animated Hero Section */}
      <AnimatedHero />
      
      {/* Dashboard Content with Ocean Theme */}
      <div className="bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/30 min-h-screen">
        
        {/* Collapsible Sidebar */}
        <motion.div
          className="fixed left-0 top-0 h-full bg-gradient-to-b from-white/90 to-cyan-50/80 backdrop-blur-lg border-r border-cyan-200/50 shadow-xl z-50 overflow-hidden"
          animate={{ 
            width: sidebarCollapsed ? '80px' : '256px'
          }}
          transition={{ 
            duration: 0.3, 
            ease: "easeInOut" 
          }}
        >
          <div className="p-6">
            {/* Logo and Toggle */}
            <div className="flex items-center justify-between mb-8">
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-lg bg-gradient-to-r from-slate-800 to-cyan-700 bg-clip-text text-transparent">ResponseAI</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-cyan-100/50 transition-colors border border-cyan-200/50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                )}
              </motion.button>
            </div>
            
            {/* Navigation */}
            <nav className="space-y-2">
              {navigationItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <Button 
                      variant={item.active ? "secondary" : "ghost"}
                      className={`w-full justify-start gap-3 transition-all duration-200 ${
                        item.active 
                          ? 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 hover:from-cyan-200 hover:to-blue-200 border border-cyan-300 shadow-sm' 
                          : 'text-slate-700 hover:bg-cyan-50/50 hover:text-cyan-800'
                      } ${sidebarCollapsed ? 'px-2' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="transition-all duration-300 ease-in-out"
          animate={{ 
            marginLeft: sidebarCollapsed ? '80px' : '256px'
          }}
        >
          {/* Clean Header */}
          <motion.header 
            className="bg-gradient-to-r from-white/80 to-cyan-50/60 backdrop-blur-lg border-b border-cyan-200/50 px-6 py-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.h1 
                  className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-cyan-700 to-blue-700 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.02 }}
                >
                  Dashboard Overview
                </motion.h1>
                <p className="text-slate-600 mt-2">Monitor and manage your AI-powered review responses</p>
              </div>
              
              <div className="flex items-center gap-4">
                <motion.div
                  className="px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200"
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-sm text-slate-600">Last updated: </span>
                  <span className="text-sm font-medium text-cyan-700">2 minutes ago</span>
                </motion.div>
              </div>
            </div>
          </motion.header>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* Stats Grid with Enhanced Ocean Theme */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {[
                { title: 'Total Reviews', value: '127', change: '+12%', icon: MessageSquare, gradient: 'from-cyan-500 to-blue-500', bg: 'from-white via-cyan-50/50 to-blue-50/30', color: 'text-emerald-600' },
                { title: 'Pending Responses', value: '8', change: 'Awaiting approval', icon: Clock, gradient: 'from-amber-500 to-orange-500', bg: 'from-white via-amber-50/50 to-orange-50/30', color: 'text-amber-600' },
                { title: 'Published', value: '119', change: 'Successfully automated', icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500', bg: 'from-white via-emerald-50/50 to-teal-50/30', color: 'text-emerald-600' },
                { title: 'Response Rate', value: '94%', change: 'Above target', icon: BarChart3, gradient: 'from-purple-500 to-indigo-500', bg: 'from-white via-purple-50/50 to-indigo-50/30', color: 'text-purple-600' }
              ].map((stat, index) => (
                <motion.div 
                  key={stat.title}
                  whileHover={{ scale: 1.02, y: -5 }} 
                  transition={{ type: "spring", stiffness: 300 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <Card className={`border-0 shadow-lg bg-gradient-to-br ${stat.bg} hover:shadow-xl transition-all duration-300 border border-cyan-200/50`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                      <div className={`w-10 h-10 bg-gradient-to-r ${stat.gradient} rounded-lg flex items-center justify-center shadow-lg`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
                      <p className={`text-sm ${stat.color} flex items-center gap-1`}>
                        {stat.title === 'Total Reviews' && <TrendingUp className="w-3 h-3" />}
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Actions with Enhanced Ocean Theme */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 to-cyan-50/50 backdrop-blur-sm mb-8 hover:shadow-xl transition-shadow border border-cyan-200/50">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-600" />
                    Quick Actions
                  </CardTitle>
                  <p className="text-slate-600 text-sm">Manage your review response workflow</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { icon: RefreshCw, label: 'Refresh Data', primary: true, description: 'Sync latest reviews' },
                      { icon: Play, label: 'Simulate Review', description: 'Test AI responses' },
                      { icon: Download, label: 'Export Data', description: 'Download reports' },
                      { icon: Activity, label: 'System Status', description: 'View health metrics' }
                    ].map((action, index) => (
                      <motion.div 
                        key={action.label}
                        whileHover={{ scale: 1.05, y: -2 }} 
                        whileTap={{ scale: 0.95 }}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="group"
                      >
                        <Button 
                          className={action.primary 
                            ? "gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg px-6 py-3"
                            : "gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300 px-6 py-3"
                          }
                          variant={action.primary ? "default" : "outline"}
                          title={action.description}
                        >
                          <action.icon className="w-4 h-4" />
                          {action.label}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Platform Integrations with Enhanced Ocean Theme */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 to-cyan-50/50 backdrop-blur-sm mb-8 hover:shadow-xl transition-shadow border border-cyan-200/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                        <Link className="w-5 h-5 text-cyan-600" />
                        Platform Integrations
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">Connect your e-commerce platforms to sync reviews automatically</p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300">
                        <Link className="w-4 h-4" />
                        Manage All
                      </Button>
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {integrations.map((integration, index) => {
                      const IconComponent = integration.icon;
                      return (
                        <motion.div
                          key={integration.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.1 * index }}
                          whileHover={{ scale: 1.05, y: -5 }}
                        >
                          <Card className={`border-2 ${integration.bgColor} hover:shadow-lg transition-all cursor-pointer`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                                    <IconComponent className={`w-5 h-5 ${integration.iconColor}`} />
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-slate-900">{integration.name}</h3>
                                  </div>
                                </div>
                                {getIntegrationStatusIcon(integration)}
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-600">Status</span>
                                  <Badge className={integration.connected 
                                    ? integration.status === 'Warning' 
                                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-100 text-rose-800 border-rose-200'
                                  }>
                                    {integration.status}
                                  </Badge>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-600">Reviews</span>
                                  <span className="text-sm font-medium text-slate-900">
                                    {integration.reviewsCount}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-600">Last Sync</span>
                                  <span className="text-sm text-slate-700">
                                    {integration.lastSync}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-3 border-t border-white/50">
                                {integration.connected ? (
                                  <Button variant="ghost" size="sm" className="w-full gap-2 text-slate-600 hover:text-slate-900 hover:bg-white/50">
                                    Configure
                                    <ArrowRight className="w-3 h-3" />
                                  </Button>
                                ) : (
                                  <Button size="sm" className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                                    Connect
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Reviews with Enhanced Ocean Theme */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 to-cyan-50/50 backdrop-blur-sm hover:shadow-xl transition-shadow border border-cyan-200/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-cyan-600" />
                        Recent Reviews
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">Latest customer feedback and AI responses</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search reviews..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64 border-cyan-200 focus:border-cyan-400 focus:ring-cyan-400/20 bg-white/60"
                        />
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" size="icon" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300">
                          <Filter className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-cyan-200/50">
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Review</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Platform</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Confidence</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map((review, index) => (
                          <motion.tr 
                            key={review.id} 
                            className="border-b border-cyan-100/50 hover:bg-gradient-to-r hover:from-cyan-50/30 hover:to-blue-50/20 transition-all"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 * index }}
                            whileHover={{ x: 5 }}
                          >
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex">{renderStars(review.rating)}</div>
                                  <span className="text-sm text-slate-600">{review.customerName}</span>
                                </div>
                                <p className="text-sm text-slate-900 max-w-md truncate">
                                  {review.content}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="outline" className="bg-white/60 border-cyan-200">
                                {review.platform}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={getStatusColor(review.status)}>
                                {review.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`font-medium ${getConfidenceColor(review.confidence)}`}>
                                {review.confidence}%
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <Calendar className="w-4 h-4" />
                                {new Date(review.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="icon" className="hover:bg-cyan-50">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
