// UI组件库统一导出

// 基础组件
export { Button } from '../Button';
export { Input } from '../Input';
export { Card, CardHeader, CardContent, CardActions, CardMedia } from './Card';
export { LoadingButton } from './LoadingButton';
export { InputField } from './InputField';
export { Toast, toastManager, ToastContainer } from './Toast';
export { Badge, StatusBadge, NotificationBadge } from './Badge';
export { Dropdown } from './Dropdown';
export { Switch, ToggleSwitch, IOSSwitch, MaterialSwitch } from './Switch';
export { Slider, RangeSlider } from './Slider';
export { Checkbox, CheckboxGroup } from './Checkbox';
export { RadioButton, RadioGroup } from './RadioButton';
export { DatePicker, DateRangePicker } from './DatePicker';
export { Modal, ConfirmDialog, BottomSheet } from './Modal';
export { Tabs, SegmentedControl, UnderlineTabs, CardTabs, ButtonTabs } from './Tabs';
export { Accordion, SimpleAccordion, BorderedAccordion, FilledAccordion } from './Accordion';
export { Pagination, SimplePagination, OutlinedPagination, FilledPagination } from './Pagination';

// Progress
export { default as Progress, LineProgress, CircleProgress, DashboardProgress, StepsProgress } from './Progress';

// Avatar
export { default as Avatar, UserAvatar, GroupAvatar, AvatarGroup } from './Avatar';

// Divider
export { default as Divider, HorizontalDivider, VerticalDivider, DashedDivider, DottedDivider, TextDivider } from './Divider';

// Skeleton
export { default as Skeleton, TextSkeleton, RectangularSkeleton, CircularSkeleton, AvatarSkeleton, CardSkeleton, ListItemSkeleton } from './Skeleton';

// Tooltip
export { default as Tooltip, InfoTooltip, WarningTooltip, ErrorTooltip, SuccessTooltip } from './Tooltip';

// Popover
export { default as Popover, InfoPopover, WarningPopover, ErrorPopover, SuccessPopover } from './Popover';

// Tag
export { default as Tag, CheckableTag, ClosableTag, OutlinedTag, FilledTag, GhostTag, RoundTag } from './Tag';

// Alert
export { default as Alert, SuccessAlert, InfoAlert, WarningAlert, ErrorAlert, BannerAlert, ClosableAlert } from './Alert';

// Drawer
export { default as Drawer, LeftDrawer, RightDrawer, TopDrawer, BottomDrawer } from './Drawer';
export type { InputFieldRef } from './InputField';

// 加载状态组件
export {
  LoadingIndicator,
  LoadingOverlay,
  SkeletonText,
  SkeletonCard,
  SkeletonListItem,
  ProgressBar,
  PulseLoader,
  useLoadingState,
} from './LoadingStates';

// 可访问性组件
export {
  AccessibleButton,
  AccessibleTextInput,
  AccessibleListItem,
  AccessibleTabs,
  AccessibleModal,
} from './AccessibleComponents';

// 键盘导航组件
export {
  KeyboardNavigationContainer,
  FocusableButton,
  KeyboardShortcuts,
  FocusTrap,
} from './KeyboardNavigation';

// 性能监控组件
export { PerformanceMonitor } from './PerformanceMonitor';

// 国际化演示组件
export { default as I18nDemo } from './I18nDemo';