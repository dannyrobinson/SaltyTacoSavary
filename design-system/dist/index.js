// src/Button.tsx
import { jsx } from "react/jsx-runtime";
function Button({ variant = "primary", size = "md", className, ...rest }) {
  const cls = ["st-btn", `st-btn--${variant}`, `st-btn--${size}`, className].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsx("button", { className: cls, ...rest });
}

// src/OpenBadge.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function OpenBadge({ open, until, children }) {
  const label = children ?? (open ? `Open now${until ? ` \u2014 until ${until}` : ""}` : "Closed right now");
  return /* @__PURE__ */ jsx2("span", { className: `st-badge${open ? "" : " st-badge--closed"}`, children: label });
}

// src/ExtensionBanner.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
function ExtensionBanner({ until, children }) {
  return /* @__PURE__ */ jsx3("div", { className: "st-banner", children: children ?? `\u{1F32E} Good news \u2014 Dave is staying open until ${until} today!` });
}

// src/SectionHeading.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
function SectionHeading({ children }) {
  return /* @__PURE__ */ jsx4("h2", { className: "st-heading", children });
}

// src/ChalkBoard.tsx
import { jsx as jsx5, jsxs } from "react/jsx-runtime";
function ChalkBoard({ title, children, flourish }) {
  return /* @__PURE__ */ jsxs("div", { className: "st-board", children: [
    title && /* @__PURE__ */ jsx5("h3", { className: "st-board__title", children: title }),
    children,
    flourish && /* @__PURE__ */ jsx5("p", { className: "st-board__flourish", children: flourish })
  ] });
}

// src/ChalkMenuItem.tsx
import { Fragment, jsx as jsx6, jsxs as jsxs2 } from "react/jsx-runtime";
function ChalkMenuItem({ name, price, chalk = "yellow", description }) {
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsxs2("li", { className: "st-menu-item", children: [
      /* @__PURE__ */ jsx6("span", { className: `st-menu-item__name st-chalk--${chalk}`, children: name }),
      /* @__PURE__ */ jsx6("span", { className: "st-menu-item__dots" }),
      /* @__PURE__ */ jsx6("span", { className: "st-menu-item__price", children: price })
    ] }),
    description && /* @__PURE__ */ jsx6("li", { className: "st-menu-item__desc", children: description })
  ] });
}

// src/DayCard.tsx
import { jsx as jsx7, jsxs as jsxs3 } from "react/jsx-runtime";
function DayCard({ day, time, closed, today }) {
  const cls = ["st-day-card", today && "st-day-card--today", closed && "st-day-card--closed"].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs3("div", { className: cls, children: [
    /* @__PURE__ */ jsx7("div", { className: "st-day-card__day", children: day }),
    /* @__PURE__ */ jsx7("div", { className: "st-day-card__time", children: closed ? "Closed" : time })
  ] });
}

// src/HoursGrid.tsx
import { jsx as jsx8 } from "react/jsx-runtime";
function HoursGrid({ children }) {
  return /* @__PURE__ */ jsx8("div", { className: "st-hours-grid", children });
}

// src/Card.tsx
import { jsx as jsx9, jsxs as jsxs4 } from "react/jsx-runtime";
function Card({ title, children, highlight }) {
  return /* @__PURE__ */ jsxs4("div", { className: `st-card${highlight ? " st-card--highlight" : ""}`, children: [
    title && /* @__PURE__ */ jsx9("h2", { className: "st-card__title", children: title }),
    children
  ] });
}
export {
  Button,
  Card,
  ChalkBoard,
  ChalkMenuItem,
  DayCard,
  ExtensionBanner,
  HoursGrid,
  OpenBadge,
  SectionHeading
};
