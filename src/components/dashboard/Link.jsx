import React from "react";

export function navigate(href) {
  if (typeof window === "undefined") {
    return;
  }
  if (window.location.pathname === href) {
    return;
  }
  window.history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function Link({ href, onClick, children, ...rest }) {
  const handleClick = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    if (onClick) {
      onClick(event);
    }
    navigate(href);
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
