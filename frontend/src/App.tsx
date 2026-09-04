import { useEffect, useMemo, useState } from "react";
import type { FeatureFlag } from "./types/FeatureFlag";
import {
  createFeatureFlag,
  deleteFeatureFlag,
  getFeatureFlags,
  toggleFeatureFlag,
  updateFeatureFlag,
} from "./api/featureFlags";
import "./App.css";

function App() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [newKey, setNewKey] = useState("");
  const [newEnvironment, setNewEnvironment] = useState("development");
  const [newEnabled, setNewEnabled] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editKey, setEditKey] = useState("");
  const [editEnvironment, setEditEnvironment] = useState("development");
  const [editEnabled, setEditEnabled] = useState(false);

  // Search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadFlags();
  }, []);

  async function loadFlags() {
    try {
      setLoading(true);
      setError(null);

      const data = await getFeatureFlags();

      setFlags(data);
    } catch {
      setError("Failed to load feature flags.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newKey.trim()) {
      setError("Feature flag key cannot be empty.");
      return;
    }

    try {
      setError(null);

      const createdFlag = await createFeatureFlag(
          newKey.trim(),
          newEnvironment,
          newEnabled
      );

      setFlags((currentFlags) => [...currentFlags, createdFlag]);

      setNewKey("");
      setNewEnvironment("development");
      setNewEnabled(false);
    } catch {
      setError("Failed to create feature flag.");
    }
  }

  async function handleToggle(id: number) {
    try {
      setError(null);

      const updatedFlag = await toggleFeatureFlag(id);

      setFlags((currentFlags) =>
          currentFlags.map((flag) =>
              flag.id === updatedFlag.id ? updatedFlag : flag
          )
      );
    } catch {
      setError("Failed to toggle feature flag.");
    }
  }

  function startEdit(flag: FeatureFlag) {
    setEditingId(flag.id);
    setEditKey(flag.key);
    setEditEnvironment(flag.environment);
    setEditEnabled(flag.enabled);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditKey("");
    setEditEnvironment("development");
    setEditEnabled(false);
  }

  async function handleUpdate(id: number) {
    if (!editKey.trim()) {
      setError("Feature flag key cannot be empty.");
      return;
    }

    try {
      setError(null);

      const updatedFlag = await updateFeatureFlag(
          id,
          editKey.trim(),
          editEnvironment,
          editEnabled
      );

      setFlags((currentFlags) =>
          currentFlags.map((flag) =>
              flag.id === updatedFlag.id ? updatedFlag : flag
          )
      );

      cancelEdit();
    } catch {
      setError("Failed to update feature flag.");
    }
  }

  async function handleDelete(id: number, key: string) {
    const confirmed = window.confirm(
        `Are you sure you want to delete "${key}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deleteFeatureFlag(id);

      setFlags((currentFlags) =>
          currentFlags.filter((flag) => flag.id !== id)
      );
    } catch {
      setError("Failed to delete feature flag.");
    }
  }

  const filteredFlags = useMemo(() => {
    return flags.filter((flag) => {
      const matchesSearch = flag.key
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesEnvironment =
          environmentFilter === "all" ||
          flag.environment === environmentFilter;

      const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "enabled" && flag.enabled) ||
          (statusFilter === "disabled" && !flag.enabled);

      return matchesSearch && matchesEnvironment && matchesStatus;
    });
  }, [flags, searchTerm, environmentFilter, statusFilter]);

  const totalFlags = flags.length;

  const enabledFlags = flags.filter(
      (flag) => flag.enabled
  ).length;

  const disabledFlags = flags.filter(
      (flag) => !flag.enabled
  ).length;

  const productionFlags = flags.filter(
      (flag) => flag.environment === "production"
  ).length;

  if (loading) {
    return (
        <div className="page-message">
          Loading feature flags...
        </div>
    );
  }

  return (
      <main>
        <header className="page-header">
          <div>
            <p className="eyebrow">Feature Management</p>

            <h1>Feature Flag Dashboard</h1>

            <p className="page-description">
              Create, manage and control application features across
              environments.
            </p>
          </div>

          <button
              type="button"
              className="refresh-button"
              onClick={loadFlags}
          >
            Refresh
          </button>
        </header>

        {error && (
            <div className="error-banner">
              <span>{error}</span>

              <button
                  type="button"
                  onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
        )}

        <section className="summary-grid">
          <div className="summary-card">
          <span className="summary-label">
            Total Flags
          </span>

            <strong>{totalFlags}</strong>

            <span className="summary-description">
            All environments
          </span>
          </div>

          <div className="summary-card">
          <span className="summary-label">
            Enabled
          </span>

            <strong>{enabledFlags}</strong>

            <span className="summary-description">
            Currently active
          </span>
          </div>

          <div className="summary-card">
          <span className="summary-label">
            Disabled
          </span>

            <strong>{disabledFlags}</strong>

            <span className="summary-description">
            Currently inactive
          </span>
          </div>

          <div className="summary-card">
          <span className="summary-label">
            Production
          </span>

            <strong>{productionFlags}</strong>

            <span className="summary-description">
            Production flags
          </span>
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <h2>Create Feature Flag</h2>

              <p>
                Add a new feature flag to your application.
              </p>
            </div>
          </div>

          <form
              className="create-form"
              onSubmit={handleCreate}
          >
            <div className="form-field flag-field">
              <label htmlFor="key">
                Flag Key
              </label>

              <input
                  id="key"
                  type="text"
                  value={newKey}
                  onChange={(event) =>
                      setNewKey(event.target.value)
                  }
                  placeholder="example: payment-v2"
              />
            </div>

            <div className="form-field">
              <label htmlFor="environment">
                Environment
              </label>

              <select
                  id="environment"
                  value={newEnvironment}
                  onChange={(event) =>
                      setNewEnvironment(event.target.value)
                  }
              >
                <option value="development">
                  Development
                </option>

                <option value="staging">
                  Staging
                </option>

                <option value="production">
                  Production
                </option>
              </select>
            </div>

            <div className="form-field enabled-field">
              <label htmlFor="enabled">
                Enabled
              </label>

              <label className="create-switch">
                <input
                    id="enabled"
                    type="checkbox"
                    checked={newEnabled}
                    onChange={(event) =>
                        setNewEnabled(event.target.checked)
                    }
                />

                <span className="create-slider" />
              </label>
            </div>

            <button
                type="submit"
                className="primary-button create-button"
            >
              + Create Flag
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="section-header flag-list-header">
            <div>
              <h2>Feature Flags</h2>

              <p>
                Showing {filteredFlags.length} of {flags.length} flags
              </p>
            </div>
          </div>

          <div className="filter-bar">
            <div className="search-wrapper">
            <span className="search-icon">
              ⌕
            </span>

              <input
                  type="text"
                  className="search-input"
                  placeholder="Search feature flags..."
                  value={searchTerm}
                  onChange={(event) =>
                      setSearchTerm(event.target.value)
                  }
              />
            </div>

            <select
                className="filter-select"
                value={environmentFilter}
                onChange={(event) =>
                    setEnvironmentFilter(event.target.value)
                }
            >
              <option value="all">
                All Environments
              </option>

              <option value="development">
                Development
              </option>

              <option value="staging">
                Staging
              </option>

              <option value="production">
                Production
              </option>
            </select>

            <select
                className="filter-select"
                value={statusFilter}
                onChange={(event) =>
                    setStatusFilter(event.target.value)
                }
            >
              <option value="all">
                All Statuses
              </option>

              <option value="enabled">
                Enabled
              </option>

              <option value="disabled">
                Disabled
              </option>
            </select>

            {(searchTerm ||
                environmentFilter !== "all" ||
                statusFilter !== "all") && (
                <button
                    type="button"
                    className="clear-filter-button"
                    onClick={() => {
                      setSearchTerm("");
                      setEnvironmentFilter("all");
                      setStatusFilter("all");
                    }}
                >
                  Clear
                </button>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
              <tr>
                <th>Flag</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
              </thead>

              <tbody>
              {filteredFlags.map((flag) => (
                  <tr key={flag.id}>
                    {editingId === flag.id ? (
                        <>
                          <td>
                            <input
                                className="edit-input"
                                type="text"
                                value={editKey}
                                onChange={(event) =>
                                    setEditKey(event.target.value)
                                }
                            />
                          </td>

                          <td>
                            <select
                                className="edit-select"
                                value={editEnvironment}
                                onChange={(event) =>
                                    setEditEnvironment(
                                        event.target.value
                                    )
                                }
                            >
                              <option value="development">
                                Development
                              </option>

                              <option value="staging">
                                Staging
                              </option>

                              <option value="production">
                                Production
                              </option>
                            </select>
                          </td>

                          <td>
                            <label className="create-switch">
                              <input
                                  type="checkbox"
                                  checked={editEnabled}
                                  onChange={(event) =>
                                      setEditEnabled(
                                          event.target.checked
                                      )
                                  }
                              />

                              <span className="create-slider" />
                            </label>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                  type="button"
                                  className="save-button"
                                  onClick={() =>
                                      handleUpdate(flag.id)
                                  }
                              >
                                Save
                              </button>

                              <button
                                  type="button"
                                  className="cancel-button"
                                  onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                    ) : (
                        <>
                          <td>
                            <div className="flag-info">
                          <span className="flag-key">
                            {flag.key}
                          </span>

                              <span className="flag-id">
                            ID #{flag.id}
                          </span>
                            </div>
                          </td>

                          <td>
                        <span
                            className={`environment-badge ${flag.environment}`}
                        >
                          {flag.environment}
                        </span>
                          </td>

                          <td>
                            <div className="status-container">
                              <button
                                  type="button"
                                  className={`toggle-switch ${
                                      flag.enabled
                                          ? "active"
                                          : ""
                                  }`}
                                  onClick={() =>
                                      handleToggle(flag.id)
                                  }
                                  aria-label={`Toggle ${flag.key}`}
                              >
                                <span className="toggle-circle" />
                              </button>

                              <span
                                  className={
                                    flag.enabled
                                        ? "status-text enabled"
                                        : "status-text disabled"
                                  }
                              >
                            {flag.enabled
                                ? "Enabled"
                                : "Disabled"}
                          </span>
                            </div>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                  type="button"
                                  className="edit-button"
                                  onClick={() =>
                                      startEdit(flag)
                                  }
                              >
                                Edit
                              </button>

                              <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() =>
                                      handleDelete(
                                          flag.id,
                                          flag.key
                                      )
                                  }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                    )}
                  </tr>
              ))}

              {filteredFlags.length === 0 && (
                  <tr>
                    <td
                        colSpan={4}
                        className="empty-state"
                    >
                      <div className="empty-state-content">
                        <strong>
                          No feature flags found
                        </strong>

                        <span>
                        Try changing your search or filters.
                      </span>
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </section>

        <footer>
          Feature Flag Dashboard · Quarkus + React + PostgreSQL
        </footer>
      </main>
  );
}

export default App;