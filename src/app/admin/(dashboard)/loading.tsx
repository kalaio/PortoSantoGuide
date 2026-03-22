export default function AdminDashboardLoading() {
  return (
    <main className="routeLoading" aria-busy="true" aria-live="polite">
      <span className="routeSpinner routeSpinnerLg" aria-hidden="true" />
    </main>
  );
}
