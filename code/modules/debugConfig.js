// Central debug flag configuration
// Toggle categories via window.DEBUG_FLAGS or programmatically.
export const DEBUG_FLAGS = {
  distance: false,
  land: false,
  victory: false,
  ui: false
};

export function isDebug(cat){
  if (typeof window !== 'undefined' && window.DEBUG_FLAGS) {
    return !!window.DEBUG_FLAGS[cat];
  }
  return !!DEBUG_FLAGS[cat];
}

export function setDebug(cat, value){
  DEBUG_FLAGS[cat] = !!value;
  if (typeof window !== 'undefined') {
    window.DEBUG_FLAGS = { ...(window.DEBUG_FLAGS||{}), [cat]: !!value };
  }
}

if (typeof window !== 'undefined') {
  window.DEBUG_FLAGS = window.DEBUG_FLAGS || { ...DEBUG_FLAGS };
  window.setDebug = setDebug;
}
