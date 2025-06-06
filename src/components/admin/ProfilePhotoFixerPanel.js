/**
 * Admin Panel for fixing null profile photos
 * Allows admins to view stats and fix null profile photos for all users
 */

import React, { useState, useEffect } from 'react';
import { useProfilePhotoFixer } from '../../hooks/useProfilePhotoFixer';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  ImageOff, 
  Image,
  RefreshCw,
  Play,
  BarChart3
} from 'lucide-react';

const ProfilePhotoFixerPanel = () => {
  const {
    isFixing,
    fixProgress,
    fixResult,
    getProfilePhotoStats,
    fixAllNullProfilePhotos,
    reset
  } = useProfilePhotoFixer();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load initial stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const statsData = await getProfilePhotoStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleStartFix = async () => {
    await fixAllNullProfilePhotos();
    // Refresh stats after fix
    await loadStats();
  };

  const getProgressPercentage = () => {
    if (fixProgress.total === 0) return 0;
    return Math.round((fixProgress.processed / fixProgress.total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Photo Fixer</h2>
          <p className="text-gray-600">
            Fix users with null profile photos by setting them to default image
          </p>
        </div>
        <Button
          onClick={loadStats}
          disabled={loadingStats || isFixing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Profile Photo Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Loading statistics...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-900">{stats.totalUsers}</div>
                <div className="text-sm text-blue-700">Total Users</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Image className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-900">{stats.usersWithValidPhotos}</div>
                <div className="text-sm text-green-700">Valid Photos</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <ImageOff className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold text-orange-900">{stats.usersWithNullPhotos}</div>
                <div className="text-sm text-orange-700">Null Photos</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Image className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <div className="text-2xl font-bold text-gray-900">{stats.usersWithDefaultPhotos}</div>
                <div className="text-sm text-gray-700">Default Photos</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Click "Refresh Stats" to load profile photo statistics
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fix Action Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Fix Null Profile Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && stats.needsFix ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                <span className="font-medium text-orange-800">
                  Action Required: {stats.usersWithNullPhotos} users need profile photo fix
                </span>
              </div>
              <p className="text-sm text-orange-700 mb-4">
                These users currently have null/empty profile photos and will be updated to use the default profile image: <code>/images/default-profile.jpg</code>
              </p>
              
              {!isFixing ? (
                <Button 
                  onClick={handleStartFix}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Profile Photo Fix
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress: {fixProgress.processed}/{fixProgress.total} users</span>
                    <span>{getProgressPercentage()}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <div className="flex space-x-4 text-sm">
                    <Badge variant="secondary">
                      Fixed: {fixProgress.fixed}
                    </Badge>
                    <Badge variant="destructive">
                      Errors: {fixProgress.errors}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ) : stats && !stats.needsFix ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">
                  All Good! All users have valid profile photos.
                </span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                No users found with null profile photos. System is healthy!
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Results Card */}
      {fixResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {fixResult.success ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              )}
              Fix Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border ${
              fixResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`font-medium mb-2 ${
                fixResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {fixResult.message}
              </p>
              
              {fixResult.totalProcessed > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Processed:</span>
                    <div className="font-bold">{fixResult.totalProcessed}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Successfully Fixed:</span>
                    <div className="font-bold text-green-600">{fixResult.totalFixed}</div>
                  </div>
                </div>
              )}
              
              {fixResult.errors && fixResult.errors.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-gray-600">Errors ({fixResult.errors.length}):</span>
                  <div className="mt-2 space-y-1">
                    {fixResult.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 bg-red-100 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
              >
                Clear Results
              </Button>
              <Button
                onClick={loadStats}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePhotoFixerPanel; 