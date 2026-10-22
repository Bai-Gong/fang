/**
 * 应用菜单模型：纯数据定义，TitleBar 负责渲染，应用侧对数组自由增删（数组即配置）。
 * v1 刻意不做：子菜单、单选组（等第一个真实需求，见 README「API 需求驱动」）。
 */

/** 菜单条目：动作项或分隔线。 */
export type MenuItemDef =
  | {
      kind: "item";
      label: string;
      /** 快捷键提示文案（如 "Ctrl+Z"），仅展示；实际键绑定在应用侧走 useHotkeys。 */
      hint?: string;
      disabled?: boolean;
      /** 勾选态（✓ 前缀），缺省不显示。 */
      checked?: boolean;
      onSelect?: () => void;
    }
  | { kind: "separator" };

/** 顶级菜单：菜单栏上的一个入口。 */
export interface MenuEntry {
  label: string;
  items: MenuItemDef[];
}

/**
 * 通用默认菜单的动作输入：只传用得到的方法，对应条目才会出现；
 * 应用专属入口（如剪的「文件：导入素材 / 导出 MP4」）由应用自行拼进数组，
 * 不需要的默认项直接 filter 掉——数据是纯的，怎么改都行。
 */
export interface DefaultMenuActions {
  onUndo?: () => void;
  onRedo?: () => void;
  onAbout?: () => void;
}

/** 组装默认菜单（编辑 / 帮助）；未提供的动作对应条目与整个菜单被剪除，全不给返回空数组。 */
export function defaultMenus(actions: DefaultMenuActions): MenuEntry[] {
  const menus: MenuEntry[] = [];
  const editItems: MenuItemDef[] = [];
  if (actions.onUndo) editItems.push({ kind: "item", label: "撤销", hint: "Ctrl+Z", onSelect: actions.onUndo });
  if (actions.onRedo) editItems.push({ kind: "item", label: "重做", hint: "Ctrl+Shift+Z", onSelect: actions.onRedo });
  if (editItems.length > 0) menus.push({ label: "编辑", items: editItems });
  if (actions.onAbout) menus.push({ label: "帮助", items: [{ kind: "item", label: "关于", onSelect: actions.onAbout }] });
  return menus;
}
