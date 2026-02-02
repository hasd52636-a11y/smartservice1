// Analytics API Service for data export and external access
export interface AnalyticsApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    dataScope: string;
    apiVersion: string;
    exportedAt: string;
  };
}

export class AnalyticsApiService {
  // Record conversation data
  static recordConversationData(data: {
    messageCount?: number;
    sessionDuration?: number;
    featureUsed?: string;
    userAgent?: string;
    screenResolution?: string;
  }) {
    try {
      // Get existing analytics data
      const existingData = localStorage.getItem('smartguide_analytics');
      let analyticsData = existingData ? JSON.parse(existingData) : {};
      
      // Update conversation metrics
      if (data.messageCount) {
        analyticsData.totalMessages = (analyticsData.totalMessages || 0) + data.messageCount;
        analyticsData.totalSessions = (analyticsData.totalSessions || 0) + 1;
      }
      
      if (data.sessionDuration) {
        const currentAvg = analyticsData.avgSessionDuration || 0;
        const currentCount = analyticsData.totalSessions || 1;
        analyticsData.avgSessionDuration = Math.round(
          (currentAvg * (currentCount - 1) + data.sessionDuration) / currentCount
        );
      }
      
      // Update feature usage
      if (data.featureUsed) {
        if (!analyticsData.featureUsage) {
          analyticsData.featureUsage = [
            { feature: 'AI Chat', usage: 0 },
            { feature: 'Video Guide', usage: 0 },
            { feature: 'Knowledge Search', usage: 0 },
            { feature: 'QR Code', usage: 0 },
            { feature: 'Voice Message', usage: 0 },
            { feature: 'File Upload', usage: 0 },
            { feature: 'Human Transfer', usage: 0 }
          ];
        }
        
        const featureIndex = analyticsData.featureUsage.findIndex(
          (f: any) => f.feature === data.featureUsed
        );
        if (featureIndex >= 0) {
          analyticsData.featureUsage[featureIndex].usage += 1;
        }
      }
      
      // Update device info
      if (data.userAgent) {
        // Parse user agent for device info
        const isMobile = /Mobile|Android|iPhone|iPad/.test(data.userAgent);
        const isTablet = /iPad|Tablet/.test(data.userAgent);
        const isDesktop = !isMobile && !isTablet;
        
        if (!analyticsData.deviceTypes) {
          analyticsData.deviceTypes = [
            { name: 'Mobile', value: 0 },
            { name: 'Desktop', value: 0 },
            { name: 'Tablet', value: 0 }
          ];
        }
        
        if (isMobile) analyticsData.deviceTypes[0].value += 1;
        else if (isDesktop) analyticsData.deviceTypes[1].value += 1;
        else if (isTablet) analyticsData.deviceTypes[2].value += 1;
      }
      
      // Save updated data
      localStorage.setItem('smartguide_analytics', JSON.stringify(analyticsData));
      
    } catch (error) {
      console.error('Failed to record conversation data:', error);
    }
  }
  
  // Export all analytics data
  static exportAnalyticsData(): AnalyticsApiResponse {
    try {
      const analyticsData = localStorage.getItem('smartguide_analytics');
      const projectsData = localStorage.getItem('smartguide_projects');
      
      return {
        success: true,
        data: {
          analytics: analyticsData ? JSON.parse(analyticsData) : {},
          projects: projectsData ? JSON.parse(projectsData) : [],
          exportedAt: new Date().toISOString()
        },
        metadata: {
          dataScope: 'complete_analytics',
          apiVersion: '1.0',
          exportedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }
  
  // Export projects data
  static exportProjectsData(): AnalyticsApiResponse {
    try {
      const projectsData = localStorage.getItem('smartguide_projects');
      
      return {
        success: true,
        data: projectsData ? JSON.parse(projectsData) : [],
        metadata: {
          dataScope: 'projects_only',
          apiVersion: '1.0',
          exportedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }
  
  // Export knowledge base data
  static exportKnowledgeData(): AnalyticsApiResponse {
    try {
      const projectsData = localStorage.getItem('smartguide_projects');
      const projects = projectsData ? JSON.parse(projectsData) : [];
      
      const knowledgeData = projects.map((project: any) => ({
        projectId: project.id,
        projectName: project.name,
        knowledgeBase: project.knowledgeBase || []
      }));
      
      return {
        success: true,
        data: knowledgeData,
        metadata: {
          dataScope: 'knowledge_base',
          apiVersion: '1.0',
          exportedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }
  
  // Export system configuration
  static exportSystemConfig(): AnalyticsApiResponse {
    try {
      const systemConfig = {
        apiKeys: {
          hasZhipuKey: !!localStorage.getItem('zhipuApiKey'),
          hasAnalyticsKey: !!localStorage.getItem('analytics_api_key')
        },
        settings: {
          theme: localStorage.getItem('theme') || 'light',
          language: localStorage.getItem('language') || 'zh-CN'
        },
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };
      
      return {
        success: true,
        data: systemConfig,
        metadata: {
          dataScope: 'system_config',
          apiVersion: '1.0',
          exportedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }
  
  // Complete data export (all data)
  static exportCompleteData(): AnalyticsApiResponse {
    try {
      const analytics = this.exportAnalyticsData();
      const projects = this.exportProjectsData();
      const knowledge = this.exportKnowledgeData();
      const systemConfig = this.exportSystemConfig();
      
      return {
        success: true,
        data: {
          analytics: analytics.data,
          projects: projects.data,
          knowledgeBase: knowledge.data,
          systemInfo: systemConfig.data
        },
        metadata: {
          dataScope: 'complete_business_data',
          apiVersion: '1.0',
          exportedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Complete export failed'
      };
    }
  }
}