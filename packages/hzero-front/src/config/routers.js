module.exports = [
  {
    authorized: true,
    title: '配置中心',
    path: '/theme-config',
    key: '/theme-config',
    component: () => import('../routes/ThemeConfigCenter'),
    models: [],
  },
  {
    path: '/exception/403',
    component: () => import('../routes/Exception/403'),
    models: [() => import('../models/error')],
  },
  {
    path: '/exception/404',
    component: () => import('../routes/Exception/404'),
    models: [() => import('../models/error')],
  },
  {
    path: '/exception/500',
    component: () => import('../routes/Exception/500'),
    models: [() => import('../models/error')],
  },
  {
    path: '/exception/501',
    component: () => import('../routes/Exception/501'),
    models: [() => import('../models/error')],
    key: '/exception/501',
    title: 'hzero.common.title.exception501',
    authorized: true,
  },
  {
    path: '/exception/trigger',
    component: () => import('../routes/Exception/triggerException'),
    models: [() => import('../models/error')],
  },
  {
    path: '/link/:link',
    component: () => import('../routes/Link'),
  },
  {
    path: '/workplace',
    component: () => import('../routes/Dashboard/Workplace'),
    models: [() => import('../models/workplace')],
  },
  {
    authorized: true,
    path: '/public/unauthorized',
    component: () => import('../routes/TokenExpired'),
    key: '/public/unauthorized',
    models: [],
  },
  {
    authorized: true,
    path: '/public/kickoff',
    component: () => import('../routes/Kickoff'),
    key: '/public/kickoff',
    models: [],
  },
];
