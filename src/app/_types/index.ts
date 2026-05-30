// Barrel for UI-only types. Anything app/ specific (visual tones, table
// shells, navigation shapes) lives here; domain types live in @/lib/types.
//
// Convention: import the barrel (`@/app/_types`) when you need types from
// multiple UI files; import the specific file (`@/app/_types/table`) when
// only one is needed — it makes ownership obvious at the call site.

export * from './style';
export * from './navigation';
export * from './table';
