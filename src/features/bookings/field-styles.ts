// Shared Tailwind classes for the booking form. The legacy global
// `label`/`input`/`select`/`textarea` rules are unlayered and outrank
// utilities, so the overrides that differ from them use the `!` modifier
// until the contract ticket removes those globals (ADR 0007).
export const fieldClass =
  "m-0! grid! content-start gap-[0.36rem] text-[0.82rem]! font-bold! text-[#40564f] " +
  "[&_input]:m-0! [&_input]:min-h-[42px] [&_input]:rounded-md! [&_input]:border-[#ccd9d1]! [&_input]:text-[0.92rem]! [&_input]:text-[#182e29]! " +
  "[&_select]:m-0! [&_select]:min-h-[42px] [&_select]:rounded-md! [&_select]:border-[#ccd9d1]! [&_select]:text-[0.92rem]! [&_select]:text-[#182e29]! " +
  "[&_textarea]:m-0! [&_textarea]:min-h-[74px] [&_textarea]:resize-y [&_textarea]:rounded-md! [&_textarea]:border-[#ccd9d1]! [&_textarea]:text-[0.92rem]! [&_textarea]:text-[#182e29]! " +
  "[&_[aria-invalid=true]]:border-[#b14545]!";

export const errorClass = "text-[0.74rem] font-bold text-[#b14545]";
