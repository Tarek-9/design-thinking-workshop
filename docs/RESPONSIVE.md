# Responsive check

Checked on 2026-11-23 against the Docker stack from `develop`, with device
emulation in Microsoft Edge (DevTools protocol,
`Emulation.setDeviceMetricsOverride`, mobile mode for phone and tablet). For
every page and width we compared `document.documentElement.scrollWidth` with
`window.innerWidth`: equal means the page does not scroll sideways.

| Width   | Device class | Form | Dashboard sign-in | Anfragen | Übersicht |
| ------- | ------------ | ---- | ----------------- | -------- | --------- |
| 320 px  | small phone  | fits | fits              | fits     | fits      |
| 390 px  | phone        | fits | fits              | fits     | fits      |
| 820 px  | tablet       | fits | fits              | fits     | fits      |
| 1440 px | desktop      | fits | fits              | fits     | fits      |

What changes with the width:

- Below the `md` breakpoint the dashboard navigation collapses into a menu
  button, and the metric cards on Übersicht stack.
- The Anfragen table keeps its columns and scrolls sideways inside its card on
  phone and tablet (`overflow-x-auto` in
  `dashboard/src/components/application/table/table.tsx`). The page itself
  stays at the viewport width.
- The form is a single column at every width; its content card is centred on
  tablet and desktop.

## Screenshots

| Page              | 390 px                                             | 820 px                                             | 1440 px                                              |
| ----------------- | -------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Form              | [phone](responsive/form-390.png)                   | [tablet](responsive/form-820.png)                  | [desktop](responsive/form-1440.png)                  |
| Dashboard sign-in | [phone](responsive/dashboard-signin-390.png)       | [tablet](responsive/dashboard-signin-820.png)      | [desktop](responsive/dashboard-signin-1440.png)      |
| Anfragen          | [phone](responsive/dashboard-applications-390.png) | [tablet](responsive/dashboard-applications-820.png) | [desktop](responsive/dashboard-applications-1440.png) |
| Übersicht         | [phone](responsive/dashboard-overview-390.png)     | [tablet](responsive/dashboard-overview-820.png)    | [desktop](responsive/dashboard-overview-1440.png)    |
