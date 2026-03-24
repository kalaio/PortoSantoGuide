export function joinAdminClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const ADMIN_PAGE_CLASS =
  "mx-auto w-[min(1120px,calc(100%-32px))] px-0 pb-12 pt-8 max-[640px]:w-[min(1120px,calc(100%-20px))] max-[640px]:pb-8 max-[640px]:pt-5";

export const ADMIN_HERO_CLASS = "mb-6 grid gap-2.5";

export const ADMIN_TITLE_CLASS = "m-0 !text-5xl leading-none text-primary max-[640px]:!text-4xl";

export const ADMIN_HEADER_ROW_CLASS =
  "flex flex-wrap items-center justify-between gap-3";

export const ADMIN_HEADER_ROW_DENSE_CLASS =
  "flex flex-wrap items-start justify-between gap-3 max-[640px]:flex-col max-[640px]:items-stretch";

export const ADMIN_HEADER_ACTIONS_CLASS = "flex flex-wrap items-center gap-3";

export const ADMIN_PANEL_CLASS =
  "rounded-3xl border border-secondary bg-[var(--admin-surface)] p-6 backdrop-blur-[18px] max-[640px]:rounded-[20px] max-[640px]:p-[18px]";

export const ADMIN_LAYOUT_GRID_CLASS = "grid gap-4 [grid-template-columns:minmax(240px,320px)_minmax(0,1fr)] max-[960px]:grid-cols-1";

export const ADMIN_TOOLBAR_PANEL_CLASS = `${ADMIN_PANEL_CLASS} grid gap-[18px]`;

export const ADMIN_SECTION_HEADING_CLASS = "m-0 !text-xl text-primary";

export const ADMIN_REQUIRED_LEGEND_CLASS = "mt-2 text-tertiary";

export const ADMIN_STATUS_MESSAGE_CLASS =
  "m-0 rounded-2xl border border-secondary bg-secondary px-4 py-3.5 text-tertiary";

export const ADMIN_STATUS_MESSAGE_ERROR_CLASS =
  "border-error_subtle bg-error-primary text-error-primary";

export const ADMIN_METRICS_CLASS =
  "flex flex-wrap justify-end gap-2.5 max-[640px]:justify-start";

export const ADMIN_TABLE_FILTERS_CLASS =
  "grid gap-3 [grid-template-columns:minmax(240px,2fr)_repeat(3,minmax(0,1fr))_minmax(140px,0.7fr)] max-[960px]:grid-cols-1";

export const ADMIN_TABLE_FILTERS_COMPACT_CLASS =
  "grid gap-3 [grid-template-columns:minmax(240px,2fr)_repeat(2,minmax(0,1fr))_minmax(140px,0.7fr)] max-[960px]:grid-cols-1";

export const ADMIN_TABLE_PANEL_CLASS = `${ADMIN_PANEL_CLASS} grid gap-[18px]`;

export const ADMIN_TABLE_SCROLLER_CLASS = "overflow-x-auto";

export const ADMIN_TABLE_FOOTER_CLASS =
  "flex items-center justify-between gap-4 max-[640px]:flex-col max-[640px]:items-stretch";

export const ADMIN_TABLE_SEARCH_ICON_CLASS = "block h-4 w-4 shrink-0 text-fg-secondary";

export const ADMIN_TABLE_CLAMP_CLASS =
  "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]";

export const ADMIN_SHELL_CLASS =
  "grid min-h-screen grid-cols-[296px_minmax(0,1fr)] bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.08),transparent_32%),var(--admin-bg)] max-[960px]:grid-cols-1";

export const ADMIN_CONTENT_CLASS = "min-w-0 px-0 pb-10 pt-3 max-[960px]:pb-8 max-[960px]:pt-0";

export const ADMIN_SIDEBAR_CLASS =
  "sticky top-0 flex min-h-screen flex-col gap-[18px] border-r border-secondary bg-[var(--admin-surface)] px-[18px] py-6 backdrop-blur-[18px] max-[960px]:static max-[960px]:min-h-0";

export const ADMIN_SIDEBAR_BRAND_CLASS = "grid gap-3 px-2 pt-1.5";

export const ADMIN_BRAND_LINK_CLASS = "text-[1.1rem] font-bold tracking-[0.02em] text-primary";

export const ADMIN_SIDEBAR_IDENTITY_CLASS = "grid gap-2";

export const ADMIN_SIDEBAR_USER_CLASS = "text-[0.95rem] font-semibold text-primary";

export const ADMIN_SIDEBAR_ROLE_CLASS = "justify-self-start";

export const ADMIN_SIDEBAR_SEARCH_CLASS = "px-1";

export const ADMIN_SIDEBAR_SEARCH_FIELD_CLASS =
  "flex min-h-12 items-center gap-3 rounded-2xl border border-secondary bg-primary px-3.5 transition-colors duration-150 focus-within:border-brand";

export const ADMIN_SIDEBAR_SEARCH_INPUT_CLASS =
  "min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-primary outline-none placeholder:text-tertiary";

export const ADMIN_SIDEBAR_NAV_SCROLL_CLASS = "flex-1 overflow-y-auto pr-1";

export const ADMIN_SIDEBAR_NAV_CLASS = "grid gap-2.5";

export const ADMIN_SIDEBAR_ITEM_BASE_CLASS =
  "flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-primary no-underline transition-colors duration-150 hover:bg-primary_hover";

export const ADMIN_SIDEBAR_ITEM_ACTIVE_CLASS = "bg-active text-primary";

export const ADMIN_SIDEBAR_ICON_CLASS = "block h-[1.15rem] w-[1.15rem] shrink-0 text-fg-secondary";

export const ADMIN_SIDEBAR_SEARCH_ICON_CLASS = "block h-4 w-4 shrink-0 text-fg-secondary";

export const ADMIN_SIDEBAR_ACCORDION_CLASS = "";

export const ADMIN_SIDEBAR_ACCORDION_TRIGGER_CLASS =
  "flex min-h-[46px] w-full items-center gap-3 rounded-2xl border-0 bg-transparent px-3.5 text-left text-primary transition-colors duration-150 hover:bg-primary_hover";

export const ADMIN_SIDEBAR_ACCORDION_TITLE_CLASS = "flex-1 leading-[1.2]";

export const ADMIN_SIDEBAR_INDICATOR_CLASS =
  "block h-4 w-4 shrink-0 text-fg-secondary transition-transform duration-150";

export const ADMIN_SIDEBAR_ACCORDION_CONTENT_CLASS = "pb-0.5 pl-[46px] pt-1.5";

export const ADMIN_SIDEBAR_GROUP_NAV_CLASS = "grid gap-1.5";

export const ADMIN_SIDEBAR_SUBITEM_CLASS =
  "flex min-h-[38px] items-center gap-3 rounded-[14px] px-3.5 text-[0.94rem] text-primary no-underline transition-colors duration-150 hover:bg-primary_hover";

export const ADMIN_SIDEBAR_EMPTY_CLASS = "px-3.5 pt-1 text-tertiary";

export const ADMIN_SIDEBAR_FOOTER_CLASS = "mt-auto px-1";

export const ADMIN_CARD_WRAPPER_CLASS =
  "rounded-3xl border border-secondary bg-[var(--admin-surface)] backdrop-blur-[18px] max-[640px]:rounded-[20px]";

export const ADMIN_CARD_SURFACE_CLASS = "h-full bg-transparent shadow-none";

export const ADMIN_CARD_HEADER_CLASS = "flex flex-wrap items-start justify-between gap-4 px-6 pb-0 pt-6 max-[640px]:flex-col max-[640px]:items-stretch";

export const ADMIN_CARD_HEADING_CLASS = "grid gap-1.5";

export const ADMIN_CARD_TITLE_CLASS = "!text-lg font-bold text-primary";

export const ADMIN_CARD_DESCRIPTION_CLASS = "m-0 text-tertiary";

export const ADMIN_CARD_BODY_CLASS = "grid gap-[18px] p-6 pt-[18px]";

export const ADMIN_FORM_SECTION_CLASS =
  "grid gap-4 rounded-[20px] border border-secondary bg-[var(--admin-surface)] p-[18px] backdrop-blur-[18px] max-[640px]:rounded-[20px] max-[640px]:p-[18px]";

export const ADMIN_FORM_SECTION_HEADER_CLASS = "flex flex-wrap items-start justify-between gap-4 max-[640px]:flex-col max-[640px]:items-stretch";

export const ADMIN_FORM_SECTION_TITLE_CLASS = ADMIN_CARD_TITLE_CLASS;

export const ADMIN_FORM_SECTION_DESCRIPTION_CLASS = ADMIN_CARD_DESCRIPTION_CLASS;

export const ADMIN_FORM_SECTION_DIVIDER_CLASS = "opacity-55";

export const ADMIN_FORM_SECTION_BODY_CLASS = "grid gap-4";

export const ADMIN_FORM_SECTION_TIGHT_CLASS = "gap-[14px]";

export const ADMIN_FORM_SECTION_SPACED_CLASS = "mt-5";

export const ADMIN_FIELD_CLASS = "grid gap-2";

export const ADMIN_FIELD_FULL_CLASS = "col-span-full";

export const ADMIN_FIELD_ROW_CLASS = "grid gap-4 md:grid-cols-2 max-[640px]:grid-cols-1";

export const ADMIN_FIELD_LABEL_ROW_CLASS = "flex flex-wrap items-center justify-between gap-3";

export const ADMIN_FIELD_LABEL_CLASS = "text-[0.95rem] font-semibold text-primary";

export const ADMIN_FIELD_REQUIRED_CLASS = "text-error-primary";

export const ADMIN_FIELD_HINT_CLASS = "text-[0.8rem] text-tertiary";

export const ADMIN_FIELD_ERROR_CLASS = "m-0 text-[0.84rem] text-error-primary";

export const ADMIN_CHECKBOX_LABEL_MUTED_CLASS = "text-tertiary";

export const ADMIN_INPUT_CLASS = "w-full";

export const ADMIN_INPUT_WRAPPER_CLASS =
  "border-secondary bg-primary !shadow-none transition-colors data-[hover=true]:border-secondary_alt group-data-[focus=true]:border-brand";

export const ADMIN_TEXTAREA_INPUT_WRAPPER_CLASS = ADMIN_INPUT_WRAPPER_CLASS;

export const ADMIN_SELECT_CLASS = "w-full";

export const ADMIN_SELECT_TRIGGER_CLASS =
  "border-secondary bg-primary !shadow-none transition-colors data-[hover=true]:border-secondary_alt data-[open=true]:border-brand data-[focus=true]:border-brand";

export const ADMIN_SELECT_VALUE_CLASS = "text-primary";

export const ADMIN_NATIVE_HIDDEN_CLASS =
  "absolute m-[-1px] h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]";

export const ADMIN_CHECKBOX_LABEL_CLASS = "inline-flex items-center gap-0.5 flex-wrap";

export const ADMIN_BUTTON_BASE_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-2xl px-[18px] font-semibold no-underline transition-colors duration-150";

export const ADMIN_BUTTON_MD_CLASS = "min-h-11 px-[18px] text-sm";

export const ADMIN_BUTTON_SM_CLASS = "min-h-9 px-3.5 text-sm";

export const ADMIN_BUTTON_FULL_CLASS = "w-full";

export const ADMIN_BUTTON_PRIMARY_CLASS =
  "bg-brand-solid text-white hover:bg-brand-solid_hover";

export const ADMIN_BUTTON_SECONDARY_CLASS =
  "border border-secondary bg-transparent text-primary hover:bg-primary_hover";

export const ADMIN_BUTTON_DANGER_CLASS = "bg-error-solid text-white hover:bg-error-solid_hover";

export const ADMIN_BUTTON_GHOST_CLASS = "bg-transparent text-primary hover:bg-primary_hover";

export const ADMIN_MENU_GRID_CLASS = "grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]";

export const ADMIN_MENU_CARD_LINK_CLASS = "block no-underline outline-none";

export const ADMIN_MENU_CARD_CLASS =
  "min-h-full transition duration-150 hover:-translate-y-px hover:border-brand focus-visible:-translate-y-px focus-visible:border-brand";

export const ADMIN_MENU_CARD_HEADER_CLASS = "grid gap-2.5 px-5 pb-[18px] pt-5";

export const ADMIN_MENU_CARD_TOP_ROW_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3";

export const ADMIN_MENU_CARD_DESCRIPTION_CLASS = "leading-[1.45]";

export const ADMIN_LOGIN_PAGE_CLASS = "grid min-h-[calc(100vh-160px)] place-items-center";

export const ADMIN_LOGIN_CARD_CLASS = "w-[min(520px,100%)]";

export const ADMIN_ACTIONS_CLASS = "flex flex-wrap items-center gap-3";

export const ADMIN_FORM_CLASS = "grid gap-4";

export const ADMIN_LIST_GRID_CLASS = "grid gap-4";

export const ADMIN_SECTION_TITLE_CLASS = "mt-2 !text-base text-primary";

export const ADMIN_LIST_LINK_CLASS = "block text-inherit no-underline outline-none";

export const ADMIN_LIST_ITEM_CLASS =
  "cursor-pointer rounded-[18px] border border-secondary bg-[var(--admin-surface)] p-4 transition duration-150 hover:-translate-y-px hover:border-brand focus-visible:-translate-y-px focus-visible:border-brand focus-visible:outline-none";

export const ADMIN_LIST_ITEM_ACTIVE_CLASS = "border-brand -translate-y-px";

export const ADMIN_UI_KIT_STACK_CLASS = "grid gap-4";

export const ADMIN_UI_KIT_BUTTON_ROW_CLASS = "flex flex-wrap items-center gap-3";

export const ADMIN_UI_KIT_BADGE_ROW_CLASS = "flex flex-wrap items-center gap-3";

export const ADMIN_UI_KIT_CARD_GRID_CLASS = "grid gap-4 md:grid-cols-2";

export const ADMIN_UI_KIT_UPLOAD_PREVIEW_CLASS = "grid gap-4";

export const ADMIN_SCOPE_BADGE_CLASS =
  "inline-flex min-h-[30px] items-center justify-center whitespace-nowrap rounded-full bg-brand-primary_alt px-2.5 text-[0.78rem] font-bold tracking-[0.01em] text-brand-secondary";

export const ADMIN_FIELD_REGISTRY_LIST_CLASS = "grid gap-[14px]";

export const ADMIN_FIELD_REGISTRY_LIST_INVALID_CLASS =
  "rounded-[18px] border border-error_subtle p-[14px]";

export const ADMIN_FIELD_REGISTRY_ITEM_CLASS = "grid gap-[14px] md:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] md:items-start";

export const ADMIN_FIELD_REGISTRY_META_CLASS = "grid gap-1.5";

export const ADMIN_FIELD_REGISTRY_CONTROLS_CLASS = "grid gap-3";

export const ADMIN_SLIDE_LIST_CLASS = "grid gap-4";

export const ADMIN_SLIDE_CARD_CLASS = `${ADMIN_PANEL_CLASS} grid gap-4`;

export const ADMIN_SLIDE_HEADER_CLASS = "flex flex-wrap items-center justify-between gap-3 max-[640px]:flex-col max-[640px]:items-start";

export const ADMIN_SLIDE_ACTIONS_CLASS = "flex flex-wrap items-center gap-3";

export const ADMIN_SLIDE_META_GRID_CLASS = "grid gap-4 md:grid-cols-2 max-[640px]:grid-cols-1";

export const ADMIN_SLIDE_MEDIA_ROW_CLASS = "col-span-full grid items-start gap-4 md:grid-cols-2 max-[640px]:grid-cols-1";

export const ADMIN_SLIDE_STATUS_FIELD_CLASS = "max-w-60 max-[640px]:max-w-none";

export const ADMIN_LISTING_STATE_BAR_CLASS = "flex flex-wrap gap-2.5";

export const ADMIN_DRAFT_CHIP_CLASS = "bg-brand-primary_alt text-brand-secondary";

export const ADMIN_SLIDE_UPLOAD_FIELD_CLASS =
  "grid min-w-0 gap-3 rounded-[20px] border border-secondary bg-[var(--admin-surface)] p-4";

export const ADMIN_SLIDE_UPLOAD_HEADER_CLASS = "flex flex-wrap items-baseline justify-between gap-3";

export const ADMIN_SLIDE_UPLOAD_HINT_CLASS = "text-tertiary";

export const ADMIN_SLIDE_UPLOAD_TRIGGER_CLASS = "w-full";

export const ADMIN_SLIDE_UPLOAD_META_CLASS = "m-0 text-tertiary";

export const ADMIN_SLIDE_PREVIEW_CLASS =
  "grid w-full place-items-center overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(18,48,60,0.04))]";

export const ADMIN_SLIDE_PREVIEW_DESKTOP_CLASS = "aspect-[16/10]";

export const ADMIN_SLIDE_PREVIEW_MOBILE_CLASS = "aspect-[3/4]";

export const ADMIN_SLIDE_PREVIEW_IMAGE_CLASS = "h-full w-full object-cover";

export const ADMIN_SLIDE_PREVIEW_PLACEHOLDER_CLASS = "text-[0.92rem] text-primary";

export const ADMIN_HOURS_EDITOR_CLASS = "grid gap-4";

export const ADMIN_HOURS_EDITOR_INVALID_CLASS =
  "rounded-[18px] border border-error_subtle p-[14px]";

export const ADMIN_HOURS_DAY_CLASS = `${ADMIN_PANEL_CLASS} grid gap-4 rounded-[20px] p-4`;

export const ADMIN_HOURS_DAY_HEADER_CLASS = "flex flex-wrap items-center justify-between gap-3";

export const ADMIN_HOURS_INTERVALS_CLASS = "grid gap-4";

export const ADMIN_HOURS_INTERVAL_ROW_CLASS = "grid items-center gap-2.5 [grid-template-columns:minmax(0,1fr)_auto_minmax(0,1fr)_auto] max-[640px]:grid-cols-1";

export const ADMIN_HOURS_INTERVAL_BUTTON_CLASS = "max-[640px]:justify-self-start";

export const ADMIN_HOURS_INTERVAL_SEPARATOR_CLASS = "justify-self-center text-tertiary";

export const ADMIN_HOURS_SECTION_CLASS = "grid gap-3";

export const ADMIN_HOURS_TITLE_CLASS = "mt-2 text-primary";

export const ADMIN_MAP_BLOCK_CLASS = "grid gap-4";

export const ADMIN_MAP_PICKER_CLASS = "min-h-[300px] overflow-hidden rounded-[22px] border border-secondary";

export const ADMIN_MAP_INVALID_CLASS = "border-error_subtle";

export const ADMIN_MAP_NOTE_CLASS = "m-0 text-tertiary";

export const ADMIN_CATEGORY_ICON_INPUT_ROW_CLASS = "flex flex-wrap items-center gap-3 [&>*:first-child]:flex-1";

export const ADMIN_CATEGORY_ICON_PREVIEW_CLASS =
  "grid h-[52px] w-[52px] place-items-center rounded-[18px] border border-secondary bg-[var(--admin-surface)] text-brand-secondary";

export const ADMIN_CUISINE_SELECT_VALUE_CLASS =
  "block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-primary";

export const ADMIN_CUISINE_SELECT_VALUE_PLACEHOLDER_CLASS = "text-tertiary";

export const ADMIN_CUISINE_SELECT_POPOVER_CLASS = "bg-[rgba(255,255,255,0.96)]";

export const ADMIN_TIME_INPUT_BASE_CLASS = "w-full";

export const ADMIN_TIME_INPUT_WRAPPER_CLASS =
  "border-secondary bg-primary !shadow-none transition-colors data-[hover=true]:border-secondary_alt group-data-[focus=true]:border-brand";

export const ADMIN_TIME_INPUT_INNER_WRAPPER_CLASS = "gap-0.5";

export const ADMIN_TIME_INPUT_SEGMENT_CLASS = "text-primary";
