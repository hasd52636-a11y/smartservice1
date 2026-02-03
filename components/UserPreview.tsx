import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProductProject, AIProvider, KnowledgeType } from '../types';
import { 
  Mic, Send, Camera, Volume2, Video, X, Sparkles, Globe, Waves, 
  PlayCircle, FileText, ChevronRight, Pencil, Circle, ArrowRight, Highlighter,
  Upload, Image as ImageIcon, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { aiService, RealtimeCallback, Annotation } from '../services/aiService';
import { projectService } from '../services/projectService';

const UserPreview: React.FC<{ projects?: ProductProject[]; projectId?: string }> = ({ projects, projectId: propProjectId }) => {
  const { id } = useParams();
  const projectId = propProjectId || id;
  const [project, setProject] = useState<ProductProject | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string>('');
  
  // 所有状态初始化移到组件顶层
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string, image?: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false); // 语音是否活跃
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null); // 静音定时器
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>('');
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrMessage, setOcrMessage] = useState({ type: 'info' as 'info' | 'success' | 'error', text: '' });
  const [isVideoChatActive, setIsVideoChatActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [avatarState, setAvatarState] = useState({
    expression: 'neutral',
    gesture: 'idle',
    speech: '',
    mouthShape: 'closed'
  });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotationType, setCurrentAnnotationType] = useState<'arrow' | 'circle' | 'text' | 'highlight'>('arrow');
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [showBannerAd, setShowBannerAd] = useState(true); // 横幅广告显示状态
  
  // References
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const videoStreamRef = useRef<MediaStream | null>(null);

  // 移动端兼容性检测 - 增强版，防止在某些环境下出错
  const isMobile = () => {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
      }
      
      // 用户代理检测
      const userAgent = navigator.userAgent || '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      // 屏幕宽度检测（安全检查）
      const screenWidth = window.innerWidth || screen?.width || 0;
      
      return mobileRegex.test(userAgent) || screenWidth <= 768;
    } catch (error) {
      console.warn('Mobile detection failed:', error);
      // 如果检测失败，默认返回false（桌面端）
      return false;
    }
  };

  // 移动端触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    // 防止移动端双击缩放
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  // 获取个性化样式
  const getCustomStyles = () => {
    const ui = project?.config.uiCustomization;
    if (!ui) return {};

    const styles: any = {};

    // 背景样式
    if (ui.backgroundType === 'color') {
      styles.backgroundColor = ui.backgroundColor;
    } else if (ui.backgroundType === 'gradient') {
      styles.background = `linear-gradient(${ui.backgroundGradient.direction}, ${ui.backgroundGradient.from}, ${ui.backgroundGradient.to})`;
    } else if (ui.backgroundType === 'image' && ui.backgroundImage) {
      styles.backgroundImage = `url(${ui.backgroundImage})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
    }

    return styles;
  };

  // 获取字体样式类名
  const getFontClasses = () => {
    const ui = project?.config.uiCustomization;
    if (!ui) return '';

    const classes = [];
    
    // 字体大小
    switch (ui.fontSize) {
      case 'xs': classes.push('text-xs'); break;
      case 'sm': classes.push('text-sm'); break;
      case 'base': classes.push('text-base'); break;
      case 'lg': classes.push('text-lg'); break;
      case 'xl': classes.push('text-xl'); break;
    }

    // 字体粗细
    switch (ui.fontWeight) {
      case 'normal': classes.push('font-normal'); break;
      case 'medium': classes.push('font-medium'); break;
      case 'semibold': classes.push('font-semibold'); break;
      case 'bold': classes.push('font-bold'); break;
    }

    return classes.join(' ');
  };

  // 获取消息框圆角类名
  const getMessageBorderRadius = () => {
    const ui = project?.config.uiCustomization;
    if (!ui) return 'rounded-lg';

    switch (ui.messageBorderRadius) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'xl': return 'rounded-xl';
      case 'full': return 'rounded-full';
      default: return 'rounded-lg';
    }
  };

  // 渲染头像
  const renderAvatar = (isUser: boolean) => {
    const ui = project?.config.uiCustomization;
    if (!ui) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
          {isUser ? '👤' : '🤖'}
        </div>
      );
    }

    const avatar = isUser ? ui.userAvatar : ui.aiAvatar;
    
    if (avatar.type === 'emoji') {
      return (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: avatar.bgColor }}
        >
          {avatar.value}
        </div>
      );
    } else if (avatar.type === 'initials') {
      return (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ 
            backgroundColor: avatar.bgColor,
            color: avatar.textColor 
          }}
        >
          {avatar.value}
        </div>
      );
    } else if (avatar.type === 'image') {
      return (
        <img 
          src={avatar.value} 
          alt={isUser ? 'User' : 'AI'} 
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            // 图片加载失败时显示默认头像
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling!.style.display = 'flex';
          }}
        />
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
        {isUser ? '👤' : '🤖'}
      </div>
    );
  };

  // 清理视频聊天函数（移到最前面，确保在useEffect中被调用时已定义）
  const cleanupVideoChat = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    aiService.disconnectFromRealtime();
    setIsVideoChatActive(false);
    setVideoStream(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setAnnotations([]);
  };

  // 从服务端加载项目数据
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setProjectError('无效的项目ID');
        setProjectLoading(false);
        return;
      }

      try {
        setProjectLoading(true);
        setProjectError('');
        
        // 验证项目ID并获取项目数据
        const validation = await projectService.validateProjectId(projectId);
        
        if (!validation.valid) {
          setProjectError(validation.error || '项目验证失败');
          setProjectLoading(false);
          return;
        }

        const validatedProject = validation.project!;
        
        // 记录用户访问（匿名统计）- 增加错误处理
        try {
          await projectService.logUserAccess(projectId, {
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            referrer: typeof document !== 'undefined' ? document.referrer : ''
          });
        } catch (logError) {
          console.warn('用户访问记录失败:', logError);
          // 不影响主流程，继续执行
        }
        
        // 直接更新状态，避免setTimeout可能导致的问题
        setProject(validatedProject);
        
        // 初始化messages状态 - 使用项目配置的欢迎语或默认欢迎语
        const welcomeMessage = validatedProject.config.welcomeMessage || 
          `您好！我是 ${validatedProject.name} 的智能售后客服助手 🤖\n\n我可以帮您解决：\n• 产品使用问题\n• 安装指导\n• 故障排查\n• 维护保养\n\n请描述您遇到的问题，或上传相关图片，我会基于产品知识库为您提供专业解答。`;
        setMessages([
          { 
            role: 'assistant', 
            text: welcomeMessage 
          }
        ]);
        
        setProjectLoading(false);
      } catch (error) {
        console.error('加载项目失败:', error);
        setProjectError('加载项目信息失败，请稍后重试');
        setProjectLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // 初始化AI服务（静默加载商家预配置的API密钥）
  useEffect(() => {
    const initializeAIService = () => {
      // 尝试从localStorage加载商家预配置的API密钥
      const savedApiKey = localStorage.getItem('zhipuApiKey');
      if (savedApiKey) {
        aiService.setZhipuApiKey(savedApiKey);
      }
      // 如果没有localStorage中的密钥，aiService会自动使用环境变量中的密钥
      
      // 移动端语音功能预热
      if (isMobile() && 'speechSynthesis' in window) {
        // 预加载语音列表，提高首次使用体验
        const loadVoices = () => {
          const voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            console.log('移动端语音功能已准备就绪，可用语音数量:', voices.length);
            
            // 查找中文语音
            const chineseVoices = voices.filter(voice => 
              voice.lang.includes('zh') || voice.lang.includes('CN')
            );
            if (chineseVoices.length > 0) {
              console.log('找到中文语音:', chineseVoices.map(v => v.name));
            }
          }
        };
        
        if (speechSynthesis.getVoices().length === 0) {
          speechSynthesis.onvoiceschanged = loadVoices;
        } else {
          loadVoices();
        }
      }
    };
    
    initializeAIService();
  }, []);

  // 滚动到最新消息
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // 清理视频聊天
  useEffect(() => {
    return () => {
      cleanupVideoChat();
    };
  }, []);

  // 项目加载中
  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a103d] to-[#2d1b69] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] border-2 border-violet-500/30 p-8 shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-violet-500/20 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="animate-spin" size={40} />
            </div>
            <h1 className="text-2xl font-black text-violet-800 mb-4">正在连接服务</h1>
            <p className="text-slate-600">正在验证二维码并加载产品信息...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 处理项目不存在或验证失败的情况
  if (!project || projectError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a103d] to-[#2d1b69] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] border-2 border-amber-500/30 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-500/20 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-black text-purple-800 mb-4">服务暂时不可用</h1>
            <p className="text-slate-600 text-center mb-4">
              {projectError || '找不到对应的项目信息，请检查二维码是否正确。'}
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-800">
                <strong>可能的原因：</strong><br/>
                • 二维码已过期或无效<br/>
                • 产品服务已暂停<br/>
                • 网络连接问题<br/>
                • 请联系中恒创世技术支持
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-black text-purple-800 mb-4">联系我们</h2>
            
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-purple-600 uppercase tracking-widest">中恒创世技术支持</p>
                <p className="text-purple-900 font-bold">400-888-6666</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-purple-600 uppercase tracking-widest">官方网站</p>
                <p className="text-purple-900 font-bold">www.aivirtualservice.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-purple-600 uppercase tracking-widest">微信公众号</p>
                <p className="text-purple-900 font-bold">AI虚拟客服助手</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-purple-200 pt-6">
            <h3 className="text-sm font-black text-purple-800 mb-3">公司信息</h3>
            <p className="text-slate-600 text-sm mb-2">公司名称：智能科技有限公司</p>
            <p className="text-slate-600 text-sm">地址：北京市海淀区科技园区88号智能大厦15层</p>
          </div>
        </div>
      </div>
    );
  }

  // Video chat functions
  const toggleVideoChat = async () => {
    if (isVideoChatActive) {
      cleanupVideoChat();
    } else {
      await initializeVideoChat();
    }
  };

  const initializeVideoChat = async () => {
    try {
      // 确保API密钥已设置（如果存在的话）
      const savedApiKey = localStorage.getItem('zhipuApiKey');
      if (savedApiKey) {
        aiService.setZhipuApiKey(savedApiKey);
      }
      
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      
      setVideoStream(stream);
      videoStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Connect to GLM-Realtime (如果有API密钥的话)
      if (savedApiKey) {
        const connected = await connectToRealtime();
        
        if (connected) {
          // Start render loop for annotations
          startRenderLoop();
          setIsVideoChatActive(true);
        } else {
          console.error('GLM-Realtime连接失败，使用基础视频功能');
          setMessages(prev => [...prev, { role: 'assistant', text: '视频聊天已启动，但AI实时功能需要配置。您可以使用基础视频功能。' }]);
          setIsVideoChatActive(true);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: '视频聊天已启动。AI实时功能需要配置，当前可使用基础视频功能。' }]);
        setIsVideoChatActive(true);
      }
    } catch (error) {
      console.error('Failed to initialize video chat:', error);
      let errorMessage = '无法访问摄像头或麦克风，请检查权限设置。';
      if (error instanceof Error) {
        if (error.message.includes('Permission denied')) {
          errorMessage = '摄像头或麦克风权限被拒绝，请在浏览器设置中允许访问。';
        } else if (error.message.includes('NotFoundError')) {
          errorMessage = '未找到摄像头或麦克风设备。';
        } else {
          errorMessage = `视频初始化失败: ${error.message}`;
        }
      }
      setMessages(prev => [...prev, { role: 'assistant', text: errorMessage }]);
    }
  };

  const connectToRealtime = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const callback: RealtimeCallback = (data, type) => {
        switch (type) {
          case 'status':
            setConnectionStatus(data.status || 'disconnected');
            setIsConnected(data.status === 'connected');
            if (data.status === 'connected') {
              resolve(true);
            } else if (data.error) {
              console.error('GLM-Realtime连接错误:', data.error);
              resolve(false);
            }
            break;
          case 'text':
            if (data.type === 'content_part_done') {
              // Content part completed
            } else if (data.type === 'function_call_done') {
              // Function call completed
            } else if (data.text) {
              setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
              
              // Update avatar state
              setAvatarState(prev => ({
                ...prev,
                speech: data.text,
                mouthShape: 'talking',
                expression: 'happy'
              }));
              
              // Reset avatar state after 3 seconds
              setTimeout(() => {
                setAvatarState(prev => ({
                  ...prev,
                  mouthShape: 'closed',
                  expression: 'neutral'
                }));
              }, 3000);
            }
            break;
          case 'annotation':
            handleAnnotationUpdate(data);
            break;
          case 'audio':
            handleAudioData(data);
            break;
          case 'video':
            handleVideoData(data);
            break;
        }
      };
      
      aiService.connectToRealtime(callback).then(success => {
        resolve(success);
      }).catch(error => {
        console.error('GLM-Realtime连接异常:', error);
        resolve(false);
      });
    });
  };

  const startRenderLoop = () => {
    const render = () => {
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw annotations
          drawAnnotations(ctx);
        }
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    animationFrameRef.current = requestAnimationFrame(render);
  };

  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    annotations.forEach(annotation => {
      ctx.save();
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 2;
      
      switch (annotation.type) {
        case 'arrow':
          drawArrow(ctx, annotation);
          break;
        case 'circle':
          drawCircle(ctx, annotation);
          break;
        case 'text':
          drawText(ctx, annotation);
          break;
        case 'highlight':
          drawHighlight(ctx, annotation);
          break;
      }
      
      ctx.restore();
    });
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { position, size } = annotation;
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + size.width, position.y + size.height);
    ctx.stroke();
    
    // Draw arrow head
    const angle = Math.atan2(size.height, size.width);
    const arrowLength = 15;
    ctx.beginPath();
    ctx.moveTo(position.x + size.width, position.y + size.height);
    ctx.lineTo(
      position.x + size.width - arrowLength * Math.cos(angle - Math.PI / 6),
      position.y + size.height - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(position.x + size.width, position.y + size.height);
    ctx.lineTo(
      position.x + size.width - arrowLength * Math.cos(angle + Math.PI / 6),
      position.y + size.height - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { position, size } = annotation;
    ctx.beginPath();
    ctx.arc(position.x, position.y, Math.max(size.width, size.height) / 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawText = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { position, content } = annotation;
    ctx.font = '16px Arial';
    ctx.fillStyle = annotation.color;
    ctx.fillText(content, position.x, position.y);
  };

  const drawHighlight = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { position, size } = annotation;
    ctx.fillStyle = `${annotation.color}40`; // Semi-transparent
    ctx.fillRect(position.x, position.y, size.width, size.height);
  };

  const handleAnnotationUpdate = (data: any) => {
    switch (data.action) {
      case 'add':
        setAnnotations(prev => [...prev, data.annotation]);
        break;
      case 'update':
        setAnnotations(prev => prev.map(a => a.id === data.id ? { ...a, ...data.updates } : a));
        break;
      case 'delete':
        setAnnotations(prev => prev.filter(a => a.id !== data.id));
        break;
    }
  };

  const handleAudioData = (data: any) => {
    if (data.audio) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const handleVideoData = (data: any) => {
    // Handle video data from server
  };

  const toggleVideo = () => {
    if (videoStream) {
      const videoTracks = videoStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (videoStream) {
      const audioTracks = videoStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isAudioOn;
      });
      setIsAudioOn(!isAudioOn);
    }
  };

  const addAnnotation = (type: 'arrow' | 'circle' | 'text' | 'highlight', content: string = '') => {
    const newAnnotation = aiService.addAnnotation({
      type,
      position: { x: 100, y: 100 },
      size: { width: 100, height: 50 },
      content: content || '标注内容',
      color: '#FF5722'
    });
    
    if (newAnnotation) {
      setAnnotations(prev => [...prev, newAnnotation]);
    }
  };

  // 获取对话历史（最近5轮对话，即10条消息）
  const getConversationHistory = () => {
    // 过滤掉图片消息，只保留文本对话
    const textMessages = messages.filter(msg => !msg.image);
    // 最多保留最近10条消息（5轮对话）
    const recentMessages = textMessages.slice(-10);
    
    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.text
    }));
  };

  // 获取当前对话轮数
  const getCurrentConversationRounds = () => {
    const textMessages = messages.filter(msg => !msg.image);
    return Math.floor(textMessages.length / 2); // 每轮对话包含用户和助手各一条消息
  };

  // 记录对话数据到Analytics
  const recordConversationData = () => {
    try {
      const analyticsData = localStorage.getItem('smartguide_analytics');
      if (analyticsData) {
        const data = JSON.parse(analyticsData);
        
        // 更新对话总次数
        data.totalMessages = (data.totalMessages || 0) + 1;
        
        // 更新平均对话轮数
        const currentRounds = getCurrentConversationRounds();
        if (currentRounds > 0) {
          data.avgConversationRounds = Math.round(
            ((data.avgConversationRounds || 0) * (data.totalMessages - 1) + currentRounds) / data.totalMessages
          );
        }
        
        // 更新对话轮数分布
        if (data.conversationRoundsDistribution) {
          if (currentRounds <= 3) {
            data.conversationRoundsDistribution[0].count += 1;
          } else if (currentRounds <= 6) {
            data.conversationRoundsDistribution[1].count += 1;
          } else if (currentRounds <= 10) {
            data.conversationRoundsDistribution[2].count += 1;
          } else if (currentRounds <= 15) {
            data.conversationRoundsDistribution[3].count += 1;
          } else {
            data.conversationRoundsDistribution[4].count += 1;
          }
        }
        
        // 更新AI Chat功能使用统计
        if (data.featureUsage) {
          const aiChatFeature = data.featureUsage.find(f => f.feature === 'AI Chat');
          if (aiChatFeature) {
            aiChatFeature.usage += 1;
          }
        }
        
        localStorage.setItem('smartguide_analytics', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to record conversation data:', error);
    }
  };

  const handleSend = async (text?: string, image?: string) => {
    const msgText = text || inputValue;
    if (!msgText && !image) {
      return;
    }
    if (!project) {
      console.error('项目不存在，无法处理消息');
      return;
    }

    try {
      // 立即添加用户消息到界面
      const userMessage = { role: 'user' as const, text: msgText, image };
      setMessages(prev => [...prev, userMessage]);
      
      // 记录对话数据到Analytics
      recordConversationData();
      
      // 用户发送消息后隐藏横幅广告
      setShowBannerAd(false);
      
      setInputValue('');
      setIsTyping(true);

      // 简化处理逻辑，让AI服务自动处理API密钥和回退逻辑
      if (image) {
        if (!project.config.multimodalEnabled) {
          setMessages(prev => [...prev, { role: 'assistant', text: "多模态分析功能已禁用，无法分析图片内容。" }]);
        } else {
          try {
            // 确保API密钥已设置（如果存在的话）
            const savedApiKey = localStorage.getItem('zhipuApiKey');
            if (savedApiKey) {
              aiService.setZhipuApiKey(savedApiKey);
            }
            
            // 图片分析 - AI服务会自动处理API密钥缺失的情况
            const response = await aiService.analyzeInstallation(image, project.config.visionPrompt, project.config.provider);
            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
          } catch (error) {
            console.error('图片分析失败:', error);
            setMessages(prev => [...prev, { role: 'assistant', text: '图片分析失败，请稍后重试。' }]);
          }
        }
      } else {
        // 确保知识库存在
        const knowledgeBase = project.knowledgeBase || [];

        try {
          // 设置API密钥（如果存在的话）
          const savedApiKey = localStorage.getItem('zhipuApiKey');
          if (savedApiKey) {
            aiService.setZhipuApiKey(savedApiKey);
          }
          
          // 对于文本消息，使用流式输出
          const newMessageId = messages.length + 1;
          setStreamingId(newMessageId);
          setStreamingMessage('');

          // 流式回调函数
          let accumulatedMessage = '';
          let lastUpdateTime = 0;
          const UPDATE_INTERVAL = 100; // 限制更新频率，避免频繁渲染
          
          const streamCallback = (chunk: string, isDone: boolean) => {
            try {
              if (chunk) {
                accumulatedMessage += chunk;
                
                // 限制更新频率，避免频繁渲染
                const now = Date.now();
                if (now - lastUpdateTime > UPDATE_INTERVAL || isDone) {
                  setStreamingMessage(accumulatedMessage);
                  lastUpdateTime = now;
                }
              }
              if (isDone) {
                if (accumulatedMessage) {
                  setMessages(prev => [...prev, { role: 'assistant', text: accumulatedMessage }]);
                }
                setStreamingId(null);
                setStreamingMessage(null);
              }
            } catch (callbackError) {
              console.error('Stream callback error:', callbackError);
              setStreamingId(null);
              setStreamingMessage(null);
            }
          };

          // 调用AI服务，使用流式输出 - AI服务会自动处理API密钥缺失的情况
          // 添加超时处理
          const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error('AI服务响应超时')), 30000); // 30秒超时
          });
          
          await Promise.race([
            aiService.getSmartResponse(
              msgText, 
              knowledgeBase, 
              project.config.provider, 
              project.config.systemInstruction,
              {
                stream: true,
                callback: streamCallback,
                projectConfig: project.config, // 传递项目配置
                conversationHistory: getConversationHistory() // 传递对话历史
              }
            ),
            timeoutPromise
          ]);
        } catch (error) {
          console.error('AI服务调用失败:', error);
          
          // 根据错误类型给出不同的用户友好提示
          let errorMessage = "抱歉，AI服务暂时不可用。";
          
          if (error instanceof Error) {
            if (error.message === 'AI服务响应超时') {
              errorMessage = 'AI服务响应超时，请稍后重试。';
            } else if (error.message.includes('429')) {
              errorMessage = "服务繁忙，请稍后重试。";
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
              errorMessage = "网络连接异常，请检查网络后重试。";
            } else {
              errorMessage = `服务错误: ${error.message}`;
            }
          }
          
          setMessages(prev => [...prev, { role: 'assistant', text: errorMessage }]);
          setStreamingId(null);
          setStreamingMessage(null);
        }
      }
    } catch (e) {
      console.error('消息处理失败:', e);
      setMessages(prev => [...prev, { role: 'assistant', text: '消息处理失败，请稍后重试。' }]);
      setStreamingId(null);
      setStreamingMessage(null);
    } finally {
      setIsTyping(false);
    }
  };

  const playTTS = async (text: string) => {
    try {
      // 确保使用保存的API密钥（如果存在的话）
      const savedApiKey = localStorage.getItem('zhipuApiKey');
      if (savedApiKey) {
        aiService.setZhipuApiKey(savedApiKey);
      }
      
      // 移动端用户交互检查
      const isMobileDevice = isMobile();
      if (isMobileDevice) {
        // 移动端需要用户明确点击才能播放语音
        console.log('移动端TTS播放开始');
      }
      
      const result = await aiService.generateSpeech(text, project.config.voiceName || 'tongtong', project.config.provider);
      if (result === 'browser_tts_success') {
        // 浏览器TTS成功，无需额外处理
        console.log('语音播放成功');
        
        // 移动端成功提示
        if (isMobileDevice) {
          // 可以添加一个短暂的视觉反馈
          const button = document.activeElement as HTMLElement;
          if (button) {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
              button.style.transform = 'scale(1)';
            }, 150);
          }
        }
      } else if (result && result !== 'browser_tts_success') {
        // 如果返回的是音频数据（base64），则播放
        const audio = new Audio(`data:audio/wav;base64,${result}`);
        audio.play();
      } else {
        // 静默处理失败情况，不显示错误消息
        console.log('语音合成不可用');
      }
    } catch (error) {
      console.error('TTS播放失败:', error);
      
      // 移动端特殊错误处理
      if (isMobile() && error instanceof Error) {
        if (error.message.includes('用户交互')) {
          // 移动端权限问题，给用户友好提示
          console.log('移动端语音需要用户交互权限');
          // 可以显示一个提示，但不中断用户体验
        } else if (error.message.includes('not-allowed')) {
          console.log('移动端语音权限被拒绝');
        }
      }
      
      // 不显示错误消息，静默处理
    }
  };

  // 语音常驻监听功能
  const toggleVoiceListening = async () => {
    if (isVoiceActive) {
      // 取消常驻监听
      stopVoiceListening();
    } else {
      // 开始常驻监听
      startVoiceListening();
    }
  };

  const startVoiceListening = async () => {
    try {
      // 确保API密钥已设置（如果存在的话）
      const savedApiKey = localStorage.getItem('zhipuApiKey');
      if (savedApiKey) {
        aiService.setZhipuApiKey(savedApiKey);
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsVoiceActive(true);
      setIsRecording(false);

      // 创建音频分析器，用于检测语音活动
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // 持续分析音频
      const analyzeAudio = () => {
        if (!isVoiceActive) return;

        analyser.getByteFrequencyData(dataArray);
        
        // 计算音频能量
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // 语音阈值
        const voiceThreshold = 50;
        const silenceThreshold = 30;

        if (average > voiceThreshold && !isRecording) {
          // 检测到语音，开始录音
          startRecording(stream);
        } else if (average < silenceThreshold && isRecording) {
          // 检测到静音，启动静音定时器
          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }
          const timer = setTimeout(() => {
            stopRecording();
          }, 1500); // 1.5秒静音后停止录音
          setSilenceTimer(timer);
        } else if (average > voiceThreshold && silenceTimer) {
          // 重新检测到语音，取消静音定时器
          clearTimeout(silenceTimer);
          setSilenceTimer(null);
        }

        requestAnimationFrame(analyzeAudio);
      };

      analyzeAudio();
    } catch (error) {
      console.error('Failed to start voice listening:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: '无法访问麦克风，请检查权限设置。' }]);
      setIsVoiceActive(false);
    }
  };

  const stopVoiceListening = () => {
    setIsVoiceActive(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
    setMediaRecorder(null);
    setAudioChunks([]);
    setIsRecording(false);
    setMessages(prev => [...prev, { role: 'assistant', text: '语音监听已关闭。' }]);
  };

  const startRecording = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    setIsRecording(true);
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setAudioChunks(prev => [...prev, event.data]);
      }
    };
    
    recorder.onstop = async () => {
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await processAudioBlob(audioBlob);
      }
      setAudioChunks([]);
      setIsRecording(false);
    };
    
    recorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  const processAudioBlob = async (audioBlob: Blob) => {
    try {
      // 确保API密钥已设置（如果存在的话）
      const savedApiKey = localStorage.getItem('zhipuApiKey');
      if (savedApiKey) {
        aiService.setZhipuApiKey(savedApiKey);
      }

      // 转换为base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        try {
          const recognizedText = await aiService.recognizeSpeech(base64Audio, project?.config.provider || 'zhipu');
          if (recognizedText) {
            handleSend(recognizedText);
          }
        } catch (error) {
          console.error('语音识别失败:', error);
          setMessages(prev => [...prev, { role: 'assistant', text: '语音识别失败，请重试或使用文字输入。' }]);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('音频处理失败:', error);
    }
  };

  // OCR 相关方法
  const showOcrMessage = (type: 'info' | 'success' | 'error', text: string) => {
    setOcrMessage({ type, text });
    setTimeout(() => setOcrMessage({ type: 'info', text: '' }), 3000);
  };

  const handleOcrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processOcrImage(file);
    }
  };
  
  const processOcrImage = async (file: File) => {
    try {
      setIsOcrProcessing(true);
      showOcrMessage('info', '正在识别图片中的文字...');
      
      // 显示上传的图片
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setOcrImage(imageUrl);
      };
      reader.readAsDataURL(file);
      
      // 确保API密钥已设置（如果存在的话）
      const savedApiKey = localStorage.getItem('zhipuApiKey');
      if (savedApiKey) {
        aiService.setZhipuApiKey(savedApiKey);
      }
      
      try {
        // 调用 OCR 服务 - AI服务会自动处理API密钥缺失的情况
        const ocrResult = await aiService.recognizeHandwriting(file, {
          languageType: 'CHN_ENG',
          probability: true
        });
        
        if (ocrResult.status === 'succeeded') {
          const recognizedText = ocrResult.words_result
            .map((item: any) => item.words)
            .join('\n');
          
          setOcrResult(recognizedText);
          showOcrMessage('success', 'OCR识别成功');
          
          // 将识别结果发送到聊天
          if (recognizedText) {
            handleSend(`OCR识别结果:\n${recognizedText}`);
          }
        } else {
          showOcrMessage('error', 'OCR识别失败');
        }
      } catch (ocrError) {
        console.error('OCR识别失败:', ocrError);
        // 如果OCR失败，提供基础的图片处理信息
        setOcrResult('OCR识别服务暂时不可用。\n\n请您：\n1. 确保图片清晰可见\n2. 文字内容完整\n3. 联系技术支持获得帮助\n\n技术支持：400-888-6666');
        showOcrMessage('info', 'OCR识别服务需要配置，已显示基础信息');
        
        // 将基础信息发送到聊天
        handleSend('图片已上传，OCR识别服务需要配置。请描述图片中的文字内容，我会为您提供相应的帮助。');
      }
    } catch (error) {
      console.error('图片处理失败:', error);
      showOcrMessage('error', '图片处理失败，请重试');
    } finally {
      setIsOcrProcessing(false);
    }
  };
  
  const clearOcrResults = () => {
    setOcrResult('');
    setOcrImage(null);
    if (ocrFileInputRef.current) {
      ocrFileInputRef.current.value = '';
    }
  };
  
  const openOcrFilePicker = () => {
    ocrFileInputRef.current?.click();
  };

  return (
    <div 
      className={`flex flex-col h-screen w-full max-w-lg mx-auto shadow-2xl relative overflow-hidden border-x border-white/10 ${getFontClasses()}`}
      style={{
        ...getCustomStyles(),
        color: project?.config.uiCustomization?.textColor || '#ffffff',
        // 移动端全屏优化
        minHeight: '100dvh', // 动态视口高度，避免地址栏影响
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => {
        // 防止移动端页面滚动
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }}
    >
      {/* Video chat interface */}
      {isVideoChatActive && (
        <div className="absolute inset-0 z-50 bg-[#0a0c10] flex flex-col">
          {/* Video chat header */}
          <header className="bg-[#0f1218]/80 backdrop-blur-3xl p-6 text-white shrink-0 border-b border-white/5 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 purple-gradient-btn rounded-2xl flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h1 className="font-black text-lg">{project.name} - 视频客服</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {connectionStatus === 'connected' ? '已连接' : '未连接'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      GLM-Realtime
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={toggleVideoChat} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white">
                <X size={20} />
              </button>
            </div>
          </header>

          {/* 横幅广告 - 视频聊天界面 */}
          {showBannerAd && project.config.uiCustomization?.bannerAd?.enabled && project.config.uiCustomization.bannerAd.imageUrl && (
            <div className="px-4 py-3 bg-gradient-to-b from-slate-900/50 to-slate-800/50 border-b border-white/10">
              <div 
                className="relative overflow-hidden rounded-2xl shadow-lg bg-white border border-slate-200/50"
                style={{ height: `${project.config.uiCustomization.bannerAd.height || 80}px` }}
              >
                {/* 立体边缘效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none rounded-2xl"></div>
                <div className="absolute inset-0 shadow-inner rounded-2xl pointer-events-none"></div>
                
                {project.config.uiCustomization.bannerAd.linkUrl ? (
                  <a
                    href={project.config.uiCustomization.bannerAd.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full group"
                  >
                    <img
                      src={project.config.uiCustomization.bannerAd.imageUrl}
                      alt="横幅广告"
                      className="w-full h-full object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        setShowBannerAd(false);
                      }}
                    />
                  </a>
                ) : (
                  <img
                    src={project.config.uiCustomization.bannerAd.imageUrl}
                    alt="横幅广告"
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      setShowBannerAd(false);
                    }}
                  />
                )}
                
                {/* 关闭按钮 */}
                {project.config.uiCustomization.bannerAd.showCloseButton && (
                  <button
                    onClick={() => setShowBannerAd(false)}
                    className="absolute top-3 right-3 w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm hover:bg-black/80 transition-all shadow-lg border border-white/20 z-10"
                  >
                    ×
                  </button>
                )}
                
                {/* 渐变遮罩，确保关闭按钮可见 */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black/10 via-transparent to-transparent pointer-events-none rounded-2xl"></div>
              </div>
            </div>
          )}

          {/* Video area */}
          <div className="flex-1 relative bg-black">
            <div className="absolute inset-0 flex items-center justify-center">
              {videoStream ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                    onMouseDown={(e) => {
                      const pressTimer = setTimeout(async () => {
                        // 长按截屏逻辑
                        if (videoRef.current) {
                          const video = videoRef.current;
                          const canvas = document.createElement('canvas');
                          canvas.width = video.videoWidth;
                          canvas.height = video.videoHeight;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            canvas.toBlob(async (blob) => {
                              if (blob) {
                                const file = new File([blob], 'screenshot.png', { type: 'image/png' });
                                // 使用现有的OCR处理函数
                                await processOcrImage(file);
                              }
                            });
                          }
                        }
                      }, 800);
                      // 清除定时器
                      const clearTimer = () => clearTimeout(pressTimer);
                      if (videoRef.current) {
                        videoRef.current.onmouseup = clearTimer;
                        videoRef.current.onmouseleave = clearTimer;
                      }
                    }}
                  />
                  <canvas 
                    ref={canvasRef} 
                    className="absolute inset-0 w-full h-full"
                    width={1280}
                    height={720}
                  />
                </>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                    <Video size={48} className="text-violet-400" />
                  </div>
                  <p className="text-white text-lg font-medium">正在初始化视频...</p>
                </div>
              )}
            </div>
            
            {/* Bottom control bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                {/* Video controls */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleVideo} 
                    className={`p-3 rounded-full ${isVideoOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400'}`}
                  >
                    <Video size={20} />
                  </button>
                  <button 
                    onClick={toggleAudio} 
                    className={`p-3 rounded-full ${isAudioOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400'}`}
                  >
                    <Mic size={20} />
                  </button>
                  <button className="p-3 bg-white/10 rounded-full text-white">
                    <Camera size={20} />
                  </button>
                </div>
                
                {/* Annotation tools */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => addAnnotation('arrow')} 
                    className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button 
                    onClick={() => addAnnotation('circle')} 
                    className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                  >
                    <Circle size={16} />
                  </button>
                  <button 
                    onClick={() => addAnnotation('text', '文本标注')} 
                    className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => addAnnotation('highlight')} 
                    className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                  >
                    <Highlighter size={16} />
                  </button>
                </div>
                
                {/* More controls */}
                <div className="flex items-center gap-3">
                  <button className="p-3 bg-white/10 rounded-full text-white">
                    <Volume2 size={20} />
                  </button>
                  <button className="p-3 purple-gradient-btn rounded-full text-white">
                    <Video size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Virtual human and chat area */}
          <div className="w-full h-64 bg-gradient-to-b from-[#1a1d29] to-[#0f1218] flex flex-col">
            {/* Virtual human area */}
            <div className="h-48 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500 via-transparent to-transparent"></div>
              </div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles size={40} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-sm">智能助手</h3>
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                  {avatarState.expression === 'neutral' ? '就绪' : '对话中'}
                </p>
              </div>
            </div>
            
            {/* Chat input area */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="问我关于此产品的问题..."
                    className="w-full bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                  <button onClick={() => handleSend()} className="absolute right-2 top-1.5 p-2 purple-gradient-btn text-white rounded-lg">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular chat interface */}
      {!isVideoChatActive && (
        <>
          <header className="bg-[#0f1218]/80 backdrop-blur-3xl p-6 text-white shrink-0 border-b border-white/5 z-20">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 purple-gradient-btn rounded-2xl flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h1 className="font-black text-lg">{project.name}</h1>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    Expert Mode 专家模式
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* 对话记忆状态指示器 */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-400 font-medium">
                    记忆 {Math.min(getCurrentConversationRounds(), 5)}/5轮
                  </span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl">
                  <Sparkles size={18} className="text-red-500" />
                </div>
              </div>
            </div>
            
            {project.config.videoGuides.filter(v => v.status === 'approved' || !v.status).length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {project.config.videoGuides
                  .filter(v => v.status === 'approved' || !v.status) // 只显示已通过审核的视频，兼容旧数据
                  .map(v => (
                    <button 
                      key={v.id}
                      onClick={() => setActiveVideo(v.url)}
                      className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 whitespace-nowrap"
                    >
                      <PlayCircle size={14} className="text-violet-500" /> {v.title}
                    </button>
                  ))
                }
              </div>
            )}
          </header>

          {/* 横幅广告 */}
          {showBannerAd && project.config.uiCustomization?.bannerAd?.enabled && project.config.uiCustomization.bannerAd.imageUrl && (
            <div className="px-4 py-3 bg-gradient-to-b from-slate-50 to-white border-b border-white/10">
              <div 
                className="relative overflow-hidden rounded-2xl shadow-lg bg-white border border-slate-200/50"
                style={{ height: `${project.config.uiCustomization.bannerAd.height || 80}px` }}
              >
                {/* 立体边缘效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none rounded-2xl"></div>
                <div className="absolute inset-0 shadow-inner rounded-2xl pointer-events-none"></div>
                
                {project.config.uiCustomization.bannerAd.linkUrl ? (
                  <a
                    href={project.config.uiCustomization.bannerAd.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full group"
                  >
                    <img
                      src={project.config.uiCustomization.bannerAd.imageUrl}
                      alt="横幅广告"
                      className="w-full h-full object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        setShowBannerAd(false);
                      }}
                    />
                  </a>
                ) : (
                  <img
                    src={project.config.uiCustomization.bannerAd.imageUrl}
                    alt="横幅广告"
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      setShowBannerAd(false);
                    }}
                  />
                )}
                
                {/* 关闭按钮 */}
                {project.config.uiCustomization.bannerAd.showCloseButton && (
                  <button
                    onClick={() => setShowBannerAd(false)}
                    className="absolute top-3 right-3 w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm hover:bg-black/80 transition-all shadow-lg border border-white/20 z-10"
                  >
                    ×
                  </button>
                )}
                
                {/* 渐变遮罩，确保关闭按钮可见 */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black/10 via-transparent to-transparent pointer-events-none rounded-2xl"></div>
              </div>
            </div>
          )}

          {activeVideo && (
            <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6">
              <button onClick={() => setActiveVideo(null)} className="absolute top-8 right-8 text-white p-3 bg-white/10 rounded-full"><X size={28}/></button>
              <video src={activeVideo} controls autoPlay className="w-full rounded-[2rem] shadow-2xl border border-white/10" />
            </div>
          )}

          {/* OCR 消息提示 */}
          {ocrMessage.text && (
            <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
              ocrMessage.type === 'success' ? 'bg-green-900/30 text-green-400' :
              ocrMessage.type === 'error' ? 'bg-red-900/30 text-red-400' :
              'bg-blue-900/30 text-blue-400'
            }`}>
              {ocrMessage.type === 'success' && <CheckCircle size={16} />}
              {ocrMessage.type === 'error' && <AlertCircle size={16} />}
              {ocrMessage.type === 'info' && <FileText size={16} />}
              <span className="text-xs">{ocrMessage.text}</span>
            </div>
          )}
          
          {/* OCR 结果显示 */}
          {ocrImage && (
            <div className="mx-6 mb-4 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-1">
                  <ImageIcon size={14} />
                  OCR 识别结果
                </h4>
                <button
                  onClick={clearOcrResults}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mb-3">
                <img
                  src={ocrImage}
                  alt="OCR Image"
                  className="w-full h-32 object-contain bg-white/5 rounded-xl"
                />
              </div>
              <div>
                <p className="text-xs text-white/80 whitespace-pre-line">
                  {ocrResult || '识别中...'}
                </p>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-8 overscroll-contain">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`flex items-end gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* 头像 */}
                  <div className="flex-shrink-0">
                    {renderAvatar(m.role === 'user')}
                  </div>
                  
                  {/* 消息内容 */}
                  <div className="flex-1">
                    <div 
                      className={`p-3 sm:p-5 shadow-xl text-sm leading-relaxed ${getMessageBorderRadius()} ${
                        m.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'
                      }`}
                      style={{
                        backgroundColor: m.role === 'user' 
                          ? project?.config.uiCustomization?.userMessageBg || '#3b82f6'
                          : project?.config.uiCustomization?.aiMessageBg || 'rgba(255, 255, 255, 0.05)',
                        color: m.role === 'user'
                          ? project?.config.uiCustomization?.userMessageText || '#ffffff'
                          : project?.config.uiCustomization?.aiMessageText || '#f1f5f9',
                        border: m.role === 'assistant' ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        // 移动端字体大小优化
                        fontSize: isMobile() ? '14px' : '16px',
                        lineHeight: isMobile() ? '1.4' : '1.6'
                      }}
                    >
                      {m.image && <img src={m.image} className="rounded-2xl mb-4 max-w-full h-auto" />}
                      <p className="break-words">{m.text}</p>
                    </div>
                    {m.role === 'assistant' && (
                      <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-3 pl-1">
                        <button 
                          onClick={() => playTTS(m.text)} 
                          className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-violet-400 p-1 sm:p-0"
                        >
                          <Volume2 size={10}/> 
                          <span className="hidden sm:inline">Audio</span> 播放语音
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Streaming message display */}
            {streamingMessage && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2">
                <div className="flex items-end gap-3 max-w-[85%] flex-row">
                  {/* AI头像 */}
                  <div className="flex-shrink-0">
                    {renderAvatar(false)}
                  </div>
                  
                  {/* 消息内容 */}
                  <div className="flex-1">
                    <div 
                      className={`p-5 shadow-xl text-sm leading-relaxed ${getMessageBorderRadius()} rounded-tl-none`}
                      style={{
                        backgroundColor: project?.config.uiCustomization?.aiMessageBg || 'rgba(255, 255, 255, 0.05)',
                        color: project?.config.uiCustomization?.aiMessageText || '#f1f5f9',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <p>{streamingMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isTyping && !streamingMessage && (
              <div className="flex gap-2 p-4 bg-white/5 w-fit rounded-2xl rounded-tl-none">
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            )}
          </div>

          {/* 手机端优化：输入框区域 */}
          <div className="p-3 sm:p-4 bg-[#0f1218]/80 backdrop-blur-3xl border-t border-white/5 safe-area-inset-bottom">
            <input
              ref={ocrFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleOcrImageUpload}
              className="hidden"
            />
            
            {/* 功能按钮区 - 移动端优化 */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="relative group">
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="p-2 sm:p-3 bg-white/5 border border-white/10 rounded-xl text-violet-400 touch-manipulation"
                    style={{ minWidth: '44px', minHeight: '44px' }} // 移动端最小触摸区域
                  >
                    <Camera size={18} />
                  </button>
                  <div className="absolute -bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-2 text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-50">
                    上传图片
                  </div>
                </div>
                <button 
                  onClick={toggleVoiceListening} 
                  className={`p-2 sm:p-3 rounded-xl border touch-manipulation ${isVoiceActive ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-violet-400'}`}
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <Mic size={18} />
                </button>
                {project.config.videoChatEnabled && (
                  <button 
                    onClick={toggleVideoChat} 
                    className="p-2 sm:p-3 bg-white/5 border border-white/10 rounded-xl text-violet-400 touch-manipulation"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                  >
                    <Video size={18} />
                  </button>
                )}
              </div>
            </div>
            
            {/* 输入框 - 移动端优化 */}
            <div className="relative">
              <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="问我关于此产品的问题..."
                className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 pr-14 sm:pr-16"
                style={{
                  backgroundColor: project?.config.uiCustomization?.inputBg || 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${project?.config.uiCustomization?.inputBorder || 'rgba(255, 255, 255, 0.1)'}`,
                  color: project?.config.uiCustomization?.inputText || '#ffffff',
                  fontSize: isMobile() ? '16px' : '14px', // 防止iOS缩放
                  minHeight: '44px' // 移动端最小触摸区域
                }}
                // 移动端优化
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="text"
                onFocus={(e) => {
                  // 移动端键盘弹出时滚动到输入框
                  if (isMobile()) {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }
                }}
                onBlur={() => {
                  // 移动端键盘收起时滚动回底部
                  if (isMobile()) {
                    setTimeout(() => {
                      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                    }, 100);
                  }
                }}
              />
              <button 
                onClick={() => handleSend()} 
                className="absolute right-2 top-2 p-2 purple-gradient-btn text-white rounded-lg touch-manipulation"
                style={{
                  backgroundColor: project?.config.uiCustomization?.buttonPrimary || '#8b5cf6',
                  minWidth: '40px',
                  minHeight: '40px'
                }}
              >
                <Send size={16} />
              </button>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                // 同时处理图片分析和OCR
                const r = new FileReader();
                r.onload = () => {
                  // 发送图片分析请求
                  handleSend("分析照片 Analyze photo", r.result as string);
                  // 同时进行OCR处理
                  processOcrImage(f);
                };
                r.readAsDataURL(f);
              }
            }} />
          </div>
        </>
      )}
    </div>
  );
};

export default UserPreview;