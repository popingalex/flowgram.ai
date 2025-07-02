import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type RouteType =
  | 'entities'
  | 'modules' // 模块列表页（保留兼容性）
  | 'module' // 模块详情页和主路由
  | 'system'
  | 'behavior-remote'
  | 'behavior-local'
  | 'behavior-script'
  | 'exp' // 行为管理根路由
  | 'exp-remote'
  | 'exp-local'
  | 'exp-inline' // 脚本改名为inline
  | 'entity-workflow'
  | 'behavior'
  | 'api-test'
  | 'test-new-architecture'
  | 'test-indexed-store'
  | 'test-behavior'
  | 'test-variable-selector'
  | 'test-properties';

export interface RouteState {
  route: RouteType;
  entityId?: string;
  expressionId?: string;
}

interface RouterContextType {
  routeState: RouteState;
  navigate: (newRouteState: RouteState) => void;
  replace: (newRouteState: RouteState) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

// 解析URL路径（支持hash和正常路径）
const parseUrl = (pathname: string, hash?: string): RouteState => {
  const urlObj = new URL(pathname, window.location.origin);
  const url = urlObj.href;

  // console.log('🔍 [parseUrl] 解析URL:', { pathname, hash });

  // 优先解析hash路径
  if (hash && hash.startsWith('#')) {
    const hashPath = hash.substring(1); // 移除#

    if (hashPath === 'entities') {
      return { route: 'entities' };
    }

    if (hashPath === 'modules') {
      return { route: 'module' }; // 修复：统一使用'module'路由
    }

    if (hashPath === 'module') {
      return { route: 'module' };
    }

    if (hashPath === 'system') {
      return { route: 'system' };
    }

    // 匹配 system/{systemId} hash路径
    const systemHashMatch = hashPath.match(/^system\/([^/]+)\/?$/);
    if (systemHashMatch) {
      return {
        route: 'system',
        entityId: systemHashMatch[1],
      };
    }

    if (hashPath === 'behavior/remote') {
      return { route: 'behavior-remote' };
    }

    if (hashPath === 'behavior/local') {
      return { route: 'behavior-local' };
    }

    if (hashPath === 'behavior/script') {
      return { route: 'behavior-script' };
    }

    if (hashPath === 'exp') {
      return { route: 'exp' };
    }

    if (hashPath === 'exp/remote') {
      return { route: 'exp-remote' };
    }

    if (hashPath === 'exp/local') {
      return { route: 'exp-local' };
    }

    if (hashPath === 'exp/inline') {
      return { route: 'exp-inline' };
    }

    // 匹配 exp/remote/{expressionId}
    const expRemoteMatch = hashPath.match(/^exp\/remote\/([^/]+)\/?$/);
    if (expRemoteMatch) {
      return {
        route: 'exp-remote',
        expressionId: expRemoteMatch[1],
      };
    }

    // 测试页面路由
    if (hashPath === 'api-test') {
      return { route: 'api-test' };
    }

    if (hashPath === 'test-new-architecture') {
      return { route: 'test-new-architecture' };
    }

    if (hashPath === 'test-indexed-store') {
      return { route: 'test-indexed-store' };
    }

    if (hashPath === 'test-behavior') {
      return { route: 'test-behavior' };
    }

    if (hashPath === 'test-variable-selector') {
      return { route: 'test-variable-selector' };
    }

    if (hashPath === 'test-properties') {
      return { route: 'test-properties' };
    }

    // 匹配 entity-workflow/{entityId}
    const entityWorkflowMatch = hashPath.match(/^entity-workflow\/([^/]+)\/?$/);
    if (entityWorkflowMatch) {
      return {
        route: 'entity-workflow',
        entityId: entityWorkflowMatch[1],
      };
    }

    // 行为编辑器路由
    if (hashPath === 'behavior') {
      return { route: 'behavior' };
    }
  }

  // 解析正常路径
  const path = pathname.replace(/^\//, '').replace(/\/$/, ''); // 移除前后斜杠

  if (path === '' || path === 'entities') {
    return { route: 'entities' };
  }

  if (path === 'modules') {
    return { route: 'module' }; // 修复：统一使用'module'路由
  }

  if (path === 'module') {
    return { route: 'module' };
  }

  if (path === 'system') {
    return { route: 'system' };
  }

  // 匹配 system/{systemId}
  const systemDetailMatch = path.match(/^system\/([^/]+)\/?$/);
  if (systemDetailMatch) {
    return {
      route: 'system',
      entityId: systemDetailMatch[1], // 复用entityId字段存储systemId
    };
  }

  if (path === 'behavior/remote') {
    return { route: 'behavior-remote' };
  }

  if (path === 'behavior/local') {
    return { route: 'behavior-local' };
  }

  if (path === 'behavior/script') {
    return { route: 'behavior-script' };
  }

  if (path === 'exp') {
    return { route: 'exp' };
  }

  if (path === 'exp/remote') {
    return { route: 'exp-remote' };
  }

  if (path === 'exp/local') {
    return { route: 'exp-local' };
  }

  if (path === 'exp/inline') {
    return { route: 'exp-inline' };
  }

  // 匹配 exp/remote/{expressionId}
  const expRemoteMatch = path.match(/^exp\/remote\/([^/]+)\/?$/);
  if (expRemoteMatch) {
    return {
      route: 'exp-remote',
      expressionId: expRemoteMatch[1],
    };
  }

  // 测试页面路由
  if (path === 'api-test') {
    return { route: 'api-test' };
  }

  if (path === 'test-new-architecture') {
    return { route: 'test-new-architecture' };
  }

  if (path === 'test-indexed-store') {
    return { route: 'test-indexed-store' };
  }

  if (path === 'test-behavior') {
    return { route: 'test-behavior' };
  }

  if (path === 'test-variable-selector') {
    return { route: 'test-variable-selector' };
  }

  if (path === 'test-properties') {
    return { route: 'test-properties' };
  }

  // 匹配 entities/{entityId}
  const entityDetailMatch = path.match(/^entities\/([^/]+)\/?$/);
  if (entityDetailMatch) {
    return {
      route: 'entities',
      entityId: entityDetailMatch[1],
    };
  }

  // 匹配 modules/{moduleId}
  const moduleDetailMatch = path.match(/^modules\/([^/]+)\/?$/);
  if (moduleDetailMatch) {
    return {
      route: 'module', // 修复：返回'module'以匹配导航项的itemKey
      entityId: moduleDetailMatch[1], // 复用entityId字段
    };
  }

  // 匹配 entity-workflow/{entityId}
  const entityWorkflowPathMatch = path.match(/^entity-workflow\/([^/]+)\/?$/);
  if (entityWorkflowPathMatch) {
    const result = {
      route: 'entity-workflow' as const,
      entityId: entityWorkflowPathMatch[1],
    };
    console.log('🔍 [parseUrl] 匹配到entity-workflow路径:', result);
    return result;
  }

  // 行为编辑器路由
  if (path === 'behavior') {
    return { route: 'behavior' };
  }

  // 匹配 behavior/{entityId}
  const behaviorDetailMatch = path.match(/^behavior\/([^/]+)\/?$/);
  if (behaviorDetailMatch) {
    return {
      route: 'behavior',
      entityId: behaviorDetailMatch[1],
    };
  }

  // 默认返回模块管理
  const result = { route: 'module' as const };
  console.log('🔍 [parseUrl] 解析结果:', result);
  return result;
};

// 生成URL路径
const generateUrl = (routeState: RouteState): string => {
  switch (routeState.route) {
    case 'entities':
      return routeState.entityId ? `/entities/${routeState.entityId}/` : '/entities/';
    case 'modules':
      return routeState.entityId ? `/modules/${routeState.entityId}/` : '/modules/';
    case 'module':
      return routeState.entityId ? `/modules/${routeState.entityId}/` : '/module/';
    case 'system':
      return routeState.entityId ? `/system/${routeState.entityId}/` : '/system/';
    case 'behavior-remote':
      return routeState.expressionId
        ? `/behavior/remote/${routeState.expressionId}/`
        : '/behavior/remote/';
    case 'behavior-local':
      return '/behavior/local/';
    case 'behavior-script':
      return '/behavior/script/';
    case 'exp':
      return '/exp/';
    case 'exp-remote':
      return routeState.expressionId ? `/exp/remote/${routeState.expressionId}/` : '/exp/remote/';
    case 'exp-local':
      return '/exp/local/';
    case 'exp-inline':
      return '/exp/inline/';
    case 'entity-workflow':
      return routeState.entityId ? `/entity-workflow/${routeState.entityId}/` : '/entity-workflow/';
    case 'behavior':
      return routeState.entityId ? `/behavior/${routeState.entityId}/` : '/behavior/';
    case 'api-test':
      return '/api-test/';
    case 'test-new-architecture':
      return '/test-new-architecture/';
    case 'test-indexed-store':
      return '/test-indexed-store/';
    case 'test-behavior':
      return '/test-behavior/';
    case 'test-variable-selector':
      return '/test-variable-selector/';
    case 'test-properties':
      return '/test-properties/';
    default:
      return '/module/';
  }
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

// Router Provider组件
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [routeState, setRouteState] = useState<RouteState>(() =>
    parseUrl(window.location.pathname, window.location.hash)
  );

  // 初始化时确保URL正确，但不强制重定向
  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const parsedRoute = parseUrl(currentPath, currentHash);

    // 只有在根路径且没有hash时才重定向
    if ((currentPath === '/' || currentPath === '') && !currentHash) {
      const newUrl = '/module/';
      window.history.replaceState({}, '', newUrl);
      setRouteState({ route: 'module' });
    } else {
      // 设置解析的路由状态，但不强制修改URL
      setRouteState(parsedRoute);
    }
  }, []);

  // 监听浏览器前进后退和hash变化
  useEffect(() => {
    const handleLocationChange = () => {
      const newState = parseUrl(window.location.pathname, window.location.hash);
      // console.log('🔍 [RouterProvider] 浏览器URL变化:', newState);
      setRouteState(newState);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // 导航到指定路由
  const navigate = useCallback((newRouteState: RouteState) => {
    const url = generateUrl(newRouteState);
    // console.log('🔍 [RouterProvider] 导航到:', { newRouteState, url });
    window.history.pushState(null, '', url);
    // console.log('🔍 [RouterProvider] 更新路由状态:', newRouteState);
    setRouteState(newRouteState);
  }, []);

  // 替换当前路由（不添加历史记录）
  const replace = useCallback((newRouteState: RouteState) => {
    const url = generateUrl(newRouteState);
    window.history.replaceState({}, '', url);
    setRouteState(newRouteState);
  }, []);

  return (
    <RouterContext.Provider value={{ routeState, navigate, replace }}>
      {children}
    </RouterContext.Provider>
  );
};
