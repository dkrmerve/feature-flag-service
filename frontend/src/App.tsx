import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import type {
  AuditLog,
  Environment,
  FeatureFlag,
} from "./types/FeatureFlag";

import {
  createFeatureFlag,
  deleteFeatureFlag,
  getAuditLogs,
  getFeatureFlags,
  toggleFeatureFlag,
  updateFeatureFlag,
} from "./api/featureFlags";

import "./App.css";

const ENVIRONMENTS: Environment[] = [
  "DEV",
  "TEST",
  "PROD",
];

type StatusFilter =
    | "all"
    | "enabled"
    | "disabled";

function App() {
  const [
    selectedEnvironment,
    setSelectedEnvironment,
  ] = useState<Environment>("DEV");

  const [flags, setFlags] =
      useState<FeatureFlag[]>([]);

  const [auditLogs, setAuditLogs] =
      useState<AuditLog[]>([]);

  const [loading, setLoading] =
      useState(true);

  const [error, setError] =
      useState<string | null>(null);

  const [actor, setActor] =
      useState("web-ui");

  const [newKey, setNewKey] =
      useState("");

  const [newEnabled, setNewEnabled] =
      useState(false);

  const [editingId, setEditingId] =
      useState<number | null>(null);

  const [editKey, setEditKey] =
      useState("");

  const [editEnabled, setEditEnabled] =
      useState(false);

  const [searchTerm, setSearchTerm] =
      useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>("all");

  const loadData = useCallback(
      async (
          environment: Environment
      ) => {
        try {
          setLoading(true);
          setError(null);

          const [
            flagData,
            auditData,
          ] = await Promise.all([
            getFeatureFlags(
                environment
            ),
            getAuditLogs(
                environment
            ),
          ]);

          setFlags(flagData);
          setAuditLogs(auditData);
        } catch (error) {
          setError(
              error instanceof Error
                  ? error.message
                  : "Failed to load dashboard data."
          );
        } finally {
          setLoading(false);
        }
      },
      []
  );

  useEffect(() => {
    void loadData(
        selectedEnvironment
    );
  }, [
    selectedEnvironment,
    loadData,
  ]);

  function handleEnvironmentChange(
      environment: Environment
  ) {
    setSelectedEnvironment(
        environment
    );

    setEditingId(null);
    setEditKey("");
    setEditEnabled(false);

    setSearchTerm("");
    setStatusFilter("all");

    setNewKey("");
    setNewEnabled(false);
  }

  async function handleCreate(
      event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!newKey.trim()) {
      setError(
          "Feature flag key cannot be empty."
      );

      return;
    }

    try {
      setError(null);

      await createFeatureFlag(
          newKey.trim(),
          selectedEnvironment,
          newEnabled,
          actor
      );

      setNewKey("");
      setNewEnabled(false);

      await loadData(
          selectedEnvironment
      );
    } catch (error) {
      setError(
          error instanceof Error
              ? error.message
              : "Failed to create feature flag."
      );
    }
  }

  async function handleToggle(
      id: number
  ) {
    try {
      setError(null);

      await toggleFeatureFlag(
          id,
          actor
      );

      await loadData(
          selectedEnvironment
      );
    } catch (error) {
      setError(
          error instanceof Error
              ? error.message
              : "Failed to toggle feature flag."
      );
    }
  }

  function startEdit(
      flag: FeatureFlag
  ) {
    setEditingId(flag.id);
    setEditKey(flag.key);
    setEditEnabled(flag.enabled);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditKey("");
    setEditEnabled(false);
  }

  async function handleUpdate(
      id: number
  ) {
    if (!editKey.trim()) {
      setError(
          "Feature flag key cannot be empty."
      );

      return;
    }

    try {
      setError(null);

      await updateFeatureFlag(
          id,
          editKey.trim(),
          selectedEnvironment,
          editEnabled,
          actor
      );

      cancelEdit();

      await loadData(
          selectedEnvironment
      );
    } catch (error) {
      setError(
          error instanceof Error
              ? error.message
              : "Failed to update feature flag."
      );
    }
  }

  async function handleDelete(
      id: number,
      key: string
  ) {
    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${key}" from ${selectedEnvironment}?`
        );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deleteFeatureFlag(
          id,
          actor
      );

      await loadData(
          selectedEnvironment
      );
    } catch (error) {
      setError(
          error instanceof Error
              ? error.message
              : "Failed to delete feature flag."
      );
    }
  }

  const filteredFlags =
      useMemo(() => {
        return flags.filter(
            (flag) => {
              const matchesSearch =
                  flag.key
                      .toLowerCase()
                      .includes(
                          searchTerm
                              .toLowerCase()
                      );

              const matchesStatus =
                  statusFilter ===
                  "all" ||
                  (
                      statusFilter ===
                      "enabled" &&
                      flag.enabled
                  ) ||
                  (
                      statusFilter ===
                      "disabled" &&
                      !flag.enabled
                  );

              return (
                  matchesSearch &&
                  matchesStatus
              );
            }
        );
      }, [
        flags,
        searchTerm,
        statusFilter,
      ]);

  const enabledFlags =
      flags.filter(
          (flag) => flag.enabled
      ).length;

  const disabledFlags =
      flags.length -
      enabledFlags;

  function formatAuditValue(
      value: boolean | null
  ) {
    if (value === null) {
      return "—";
    }

    return value
        ? "ON"
        : "OFF";
  }

  function formatDate(
      value: string
  ) {
    const date =
        new Date(value);

    return new Intl.DateTimeFormat(
        undefined,
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
    ).format(date);
  }

  return (
      <main>
        <header className="page-header">
          <div>
            <p className="eyebrow">
              Feature Management
            </p>

            <h1>
              Feature Flag Dashboard
            </h1>

            <p className="page-description">
              Manage feature flags
              across development,
              test and production
              environments.
            </p>
          </div>

          <div className="header-actions">
            <label className="actor-field">
                        <span>
                            Changed by
                        </span>

              <input
                  type="text"
                  value={actor}
                  onChange={(
                      event
                  ) =>
                      setActor(
                          event
                              .target
                              .value
                      )
                  }
                  placeholder="username"
              />
            </label>

            <button
                type="button"
                className="refresh-button"
                onClick={() =>
                    void loadData(
                        selectedEnvironment
                    )
                }
            >
              Refresh
            </button>
          </div>
        </header>

        {error && (
            <div className="error-banner">
                    <span>
                        {error}
                    </span>

              <button
                  type="button"
                  onClick={() =>
                      setError(null)
                  }
              >
                ×
              </button>
            </div>
        )}

        <section className="environment-panel">
          <div>
                    <span className="environment-title">
                        Environment
                    </span>

            <span className="environment-help">
                        Select the environment
                        you want to manage.
                    </span>
          </div>

          <div className="environment-tabs">
            {ENVIRONMENTS.map(
                (
                    environment
                ) => (
                    <button
                        key={
                          environment
                        }
                        type="button"
                        className={`environment-tab ${
                            selectedEnvironment ===
                            environment
                                ? "active"
                                : ""
                        } ${environment.toLowerCase()}`}
                        onClick={() =>
                            handleEnvironmentChange(
                                environment
                            )
                        }
                    >
                      {
                        environment
                      }
                    </button>
                )
            )}
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
                    <span className="summary-label">
                        Environment
                    </span>

            <strong>
              {
                selectedEnvironment
              }
            </strong>

            <span className="summary-description">
                        Current workspace
                    </span>
          </div>

          <div className="summary-card">
                    <span className="summary-label">
                        Total Flags
                    </span>

            <strong>
              {flags.length}
            </strong>

            <span className="summary-description">
                        In{" "}
              {
                selectedEnvironment
              }
                    </span>
          </div>

          <div className="summary-card">
                    <span className="summary-label">
                        Enabled
                    </span>

            <strong>
              {
                enabledFlags
              }
            </strong>

            <span className="summary-description">
                        Currently active
                    </span>
          </div>

          <div className="summary-card">
                    <span className="summary-label">
                        Disabled
                    </span>

            <strong>
              {
                disabledFlags
              }
            </strong>

            <span className="summary-description">
                        Currently inactive
                    </span>
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <h2>
                Create Feature Flag
              </h2>

              <p>
                New flag will
                be created in{" "}
                <strong>
                  {
                    selectedEnvironment
                  }
                </strong>
                .
              </p>
            </div>
          </div>

          <form
              className="create-form"
              onSubmit={
                handleCreate
              }
          >
            <div className="form-field flag-field">
              <label htmlFor="key">
                Flag Key
              </label>

              <input
                  id="key"
                  type="text"
                  value={newKey}
                  onChange={(
                      event
                  ) =>
                      setNewKey(
                          event
                              .target
                              .value
                      )
                  }
                  placeholder="example: payment-v2"
              />
            </div>

            <div className="selected-environment-field">
                        <span>
                            Environment
                        </span>

              <strong
                  className={`environment-badge ${selectedEnvironment.toLowerCase()}`}
              >
                {
                  selectedEnvironment
                }
              </strong>
            </div>

            <div className="form-field enabled-field">
              <label htmlFor="enabled">
                Enabled
              </label>

              <label className="create-switch">
                <input
                    id="enabled"
                    type="checkbox"
                    checked={
                      newEnabled
                    }
                    onChange={(
                        event
                    ) =>
                        setNewEnabled(
                            event
                                .target
                                .checked
                        )
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
              <h2>
                Feature Flags
              </h2>

              <p>
                Showing{" "}
                {
                  filteredFlags.length
                }{" "}
                of{" "}
                {
                  flags.length
                }{" "}
                flags in{" "}
                {
                  selectedEnvironment
                }
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
                  value={
                    searchTerm
                  }
                  onChange={(
                      event
                  ) =>
                      setSearchTerm(
                          event
                              .target
                              .value
                      )
                  }
              />
            </div>

            <select
                className="filter-select"
                value={
                  statusFilter
                }
                onChange={(
                    event
                ) =>
                    setStatusFilter(
                        event
                            .target
                            .value as StatusFilter
                    )
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
                statusFilter !==
                "all") && (
                <button
                    type="button"
                    className="clear-filter-button"
                    onClick={() => {
                      setSearchTerm(
                          ""
                      );
                      setStatusFilter(
                          "all"
                      );
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
                <th>
                  Flag
                </th>

                <th>
                  Environment
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>
              </tr>
              </thead>

              <tbody>
              {filteredFlags.map(
                  (
                      flag
                  ) => (
                      <tr
                          key={
                            flag.id
                          }
                      >
                        {editingId ===
                        flag.id ? (
                            <>
                              <td>
                                <input
                                    className="edit-input"
                                    type="text"
                                    value={
                                      editKey
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setEditKey(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />
                              </td>

                              <td>
                                                    <span
                                                        className={`environment-badge ${flag.environment.toLowerCase()}`}
                                                    >
                                                        {
                                                          flag.environment
                                                        }
                                                    </span>
                              </td>

                              <td>
                                <label className="create-switch">
                                  <input
                                      type="checkbox"
                                      checked={
                                        editEnabled
                                      }
                                      onChange={(
                                          event
                                      ) =>
                                          setEditEnabled(
                                              event
                                                  .target
                                                  .checked
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
                                          void handleUpdate(
                                              flag.id
                                          )
                                      }
                                  >
                                    Save
                                  </button>

                                  <button
                                      type="button"
                                      className="cancel-button"
                                      onClick={
                                        cancelEdit
                                      }
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
                                                            {
                                                              flag.key
                                                            }
                                                        </span>

                                  <span className="flag-id">
                                                            ID #
                                    {
                                      flag.id
                                    }
                                                        </span>
                                </div>
                              </td>

                              <td>
                                                    <span
                                                        className={`environment-badge ${flag.environment.toLowerCase()}`}
                                                    >
                                                        {
                                                          flag.environment
                                                        }
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
                                          void handleToggle(
                                              flag.id
                                          )
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
                                          startEdit(
                                              flag
                                          )
                                      }
                                  >
                                    Edit
                                  </button>

                                  <button
                                      type="button"
                                      className="delete-button"
                                      onClick={() =>
                                          void handleDelete(
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
                  )
              )}

              {filteredFlags.length ===
                  0 && (
                      <tr>
                        <td
                            colSpan={
                              4
                            }
                            className="empty-state"
                        >
                          <div className="empty-state-content">
                            <strong>
                              {loading
                                  ? "Loading..."
                                  : "No feature flags found"}
                            </strong>

                            {!loading && (
                                <span>
                                                    Create
                                                    a flag
                                                    or
                                                    change
                                                    the
                                                    filters.
                                                </span>
                            )}
                          </div>
                        </td>
                      </tr>
                  )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="section-header audit-header">
            <div>
              <h2>
                Audit History
              </h2>

              <p>
                Latest changes
                in{" "}
                {
                  selectedEnvironment
                }
              </p>
            </div>

            <span className="audit-count">
                        {
                          auditLogs.length
                        }{" "}
              events
                    </span>
          </div>

          <div className="audit-list">
            {auditLogs.map(
                (
                    audit
                ) => (
                    <article
                        key={
                          audit.id
                        }
                        className="audit-item"
                    >
                      <div className="audit-main">
                        <div className="audit-title-row">
                          <strong>
                            {
                              audit.flagKey
                            }
                          </strong>

                          <span
                              className={`audit-action ${audit.action.toLowerCase()}`}
                          >
                                            {
                                              audit.action
                                            }
                                        </span>

                          <span
                              className={`environment-badge ${audit.environment.toLowerCase()}`}
                          >
                                            {
                                              audit.environment
                                            }
                                        </span>
                        </div>

                        <div className="audit-details">
                                        <span className="audit-transition">
                                            {formatAuditValue(
                                                audit.oldValue
                                            )}
                                          {" → "}
                                          {formatAuditValue(
                                              audit.newValue
                                          )}
                                        </span>

                          <span>
                                            by{" "}
                            <strong>
                                                {
                                                  audit.changedBy
                                                }
                                            </strong>
                                        </span>
                        </div>
                      </div>

                      <time>
                        {formatDate(
                            audit.changedAt
                        )}
                      </time>
                    </article>
                )
            )}

            {auditLogs.length ===
                0 && (
                    <div className="audit-empty">
                      No audit events
                      for{" "}
                      {
                        selectedEnvironment
                      }{" "}
                      yet.
                    </div>
                )}
          </div>
        </section>

        <footer>
          Feature Flag Dashboard ·
          Quarkus + React +
          PostgreSQL
        </footer>
      </main>
  );
}

export default App;