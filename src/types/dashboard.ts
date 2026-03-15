export interface MenuItemLink {
  label: string;
  href: string;
  type: "link";
}

export interface MenuItemGroup {
  label: string;
  type: "group";
  items: MenuItemLink[];
}

export type MenuItem = MenuItemLink | MenuItemGroup;

export function isGroup(item: MenuItem): item is MenuItemGroup {
  return item.type === "group";
}
