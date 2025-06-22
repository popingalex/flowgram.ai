import { useState, useEffect, useCallback } from 'react';

export type RouteType =
  | 'entities'
  | 'modules'
  | 'exp-remote'
  | 'exp-local'
  | 'entity-workflow'
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

// 解析URL路径（支持hash和正常路径）
const parseUrl = (pathname: string, hash?: string): RouteState => {
  // 优先解析hash路径
  if (hash && hash.startsWith('#')) {
    const hashPath = hash.substring(1); // 移除#

    if (hashPath === 'entities') {
      return { route: 'entities' };
    }

    if (hashPath === 'modules') {
      return { route: 'modules' };
    }

    if (hashPath === 'exp/remote') {
      return { route: 'exp-remote' };
    }

    if (hashPath === 'exp/local') {
      return { route: 'exp-local' };
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
  }

  // 解析正常路径
  const path = pathname.replace(/^\//, '').replace(/\/$/, ''); // 移除前后斜杠

  if (path === '' || path === 'entities') {
    return { route: 'entities' };
  }

  if (path === 'modules') {
    return { route: 'modules' };
  }

  if (path === 'exp/remote') {
    return { route: 'exp-remote' };
  }

  if (path === 'exp/local') {
    return { route: 'exp-local' };
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
  const entityWorkflowMatch = path.match(/^entities\/([^/]+)\/?$/);
  if (entityWorkflowMatch) {
    return {
      route: 'entity-workflow',
      entityId: entityWorkflowMatch[1],
    };
  }

  // 默认返回实体列表
  return { route: 'entities' };
};

// 生成URL路径
const generateUrl = (routeState: RouteState): string => {
  switch (routeState.route) {
    case 'entities':
      return '/entities/';
    case 'modules':
      return '/modules/';
    case 'exp-remote':
      return routeState.expressionId ? `/exp/remote/${routeState.expressionId}/` : '/exp/remote/';
    case 'exp-local':
      return '/exp/local/';
    case 'entity-workflow':
      return `/entities/${routeState.entityId}/`;
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
      return '/entities/';
  }
};

export const useRouter = () => {
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
      const newUrl = '/entities/';
      window.history.replaceState({}, '', newUrl);
      setRouteState({ route: 'entities' });
    } else {
      // 设置解析的路由状态，但不强制修改URL
      setRouteState(parsedRoute);
    }
  }, []);

  // 监听浏览器前进后退和hash变化
  useEffect(() => {
    const handleLocationChange = () => {
      setRouteState(parseUrl(window.location.pathname, window.location.hash));
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
    window.history.pushState({}, '', url);
    setRouteState(newRouteState);
  }, []);

  // 替换当前路由（不添加历史记录）
  const replace = useCallback((newRouteState: RouteState) => {
    const url = generateUrl(newRouteState);
    window.history.replaceState({}, '', url);
    setRouteState(newRouteState);
  }, []);

  return {
    routeState,
    navigate,
    replace,
  };
};
