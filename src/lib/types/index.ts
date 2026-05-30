// Barrel for backend / domain types. Each file owns one domain
// (user, vendor, bill, payment, category) plus a `common` module for
// cross-domain primitives like ActionResult and pagination/sorting.
//
// Convention: import the barrel (`@/lib/types`) when you need types from
// multiple domains; import the specific file (`@/lib/types/bill`) when
// you only need one domain — it makes ownership obvious at the call site.

export * from './common';
export * from './user';
export * from './vendor';
export * from './category';
export * from './payment';
export * from './bill';
