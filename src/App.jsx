import { useEffect, useState } from "react";
import "./App.css";

const API = "https://crisis-command-backend.onrender.com";

function App() {
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [plan, setPlan] = useState(null);
  const [diff, setDiff] = useState(null);
  const [audit, setAudit] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    try {
      const [inc, res, pl, df, au] = await Promise.all([
        fetch(`${API}/incidents`).then(r => r.json()),
        fetch(`${API}/resources`).then(r => r.json()),
        fetch(`${API}/plan`).then(r => r.json()),
        fetch(`${API}/plan-diff`).then(r => r.json()),
        fetch(`${API}/audit`).then(r => r.json()),
      ]);

      setIncidents(inc);
      setResources(res);
      setPlan(pl.message ? null : pl);
      setDiff(df);
      setAudit(au);
    } catch (error) {
      console.error("Backend connection error:", error);
    }
  }

  useEffect(() => {
    loadDashboard();

    const timer = setInterval(loadDashboard, 3000);

    return () => clearInterval(timer);
  }, []);

  async function createIncident() {
    if (!message.trim()) return;

    setLoading(true);

    await fetch(`${API}/incident`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
      }),
    });

    setMessage("");

    await loadDashboard();

    setLoading(false);
  }

  async function breakdownAmbulance() {
    setLoading(true);

    await fetch(`${API}/inject-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "AMB-01 broken down and unavailable",
      }),
    });

    await loadDashboard();

    setLoading(false);
  }

  async function resetSystem() {
    setLoading(true);

    await fetch(`${API}/reset`, {
      method: "POST",
    });

    await loadDashboard();

    setLoading(false);
  }

  async function approvePlan() {
    if (!plan) return;

    await fetch(`${API}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: plan.plan_id,
        approved: true,
        commander: "Demo Commander",
      }),
    });

    await loadDashboard();
  }

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">
        <div>
          <div className="brand">
            <span className="brand-icon">⚡</span>
            CRISIS COMMAND
          </div>

          <div className="subtitle">
            Multi-Agent Emergency Response & Resource Coordination
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          SYSTEM ONLINE
        </div>
      </header>

      {/* STATS */}

      <section className="stats">

        <div className="stat-card">
          <span>ACTIVE INCIDENTS</span>
          <strong>{incidents.length}</strong>
        </div>

        <div className="stat-card">
          <span>AVAILABLE RESOURCES</span>
          <strong>
            {resources.filter(r => r.available).length}
          </strong>
        </div>

        <div className="stat-card">
          <span>PLAN VERSION</span>
          <strong>{plan?.version || 0}</strong>
        </div>

        <div className="stat-card">
          <span>REPLANNING</span>

          <strong className={diff?.diff?.has_changes ? "warning" : ""}>
            {diff?.diff?.has_changes ? "ACTIVE" : "STABLE"}
          </strong>
        </div>

      </section>

      {/* DASHBOARD */}

      <main className="dashboard">

        {/* INCIDENTS */}

        <section className="panel">

          <div className="panel-title">
            <h2>🚨 Active Incidents</h2>
            <span>{incidents.length} events</span>
          </div>

          {incidents.length === 0 ? (

            <div className="empty">
              No active incidents
            </div>

          ) : (

            incidents.map((incident) => (

              <div className="incident" key={incident.id}>

                <div className="incident-top">
                  <strong>{incident.id}</strong>

                  <span className="severity">
                    SEVERITY {incident.severity}/10
                  </span>
                </div>

                <div className="incident-type">
                  {incident.incident_type
                    .replaceAll("_", " ")
                    .toUpperCase()}
                </div>

                <div className="incident-info">

                  📍 {incident.location}

                  <span>
                    👥 {incident.people_at_risk} at risk
                  </span>

                </div>

                <div className="priority">
                  Priority Score:
                  <b>{incident.priority_score}</b>
                </div>

              </div>

            ))
          )}

        </section>

        {/* RESOURCES */}

        <section className="panel">

          <div className="panel-title">
            <h2>🚑 Resources</h2>
            <span>Live status</span>
          </div>

          {resources.map((resource) => (

            <div className="resource" key={resource.id}>

              <div className="resource-icon">
                {resource.type === "ambulance"
                  ? "🚑"
                  : "🧑‍🚒"}
              </div>

              <div className="resource-main">

                <strong>{resource.id}</strong>

                <small>
                  {resource.type.replaceAll("_", " ")}
                </small>

                <small>
                  📍 {resource.location}
                </small>

              </div>

              <span
                className={
                  resource.available
                    ? "available"
                    : "unavailable"
                }
              >
                {resource.available
                  ? "AVAILABLE"
                  : "UNAVAILABLE"}
              </span>

            </div>

          ))}

        </section>

        {/* RESPONSE PLAN */}

        <section className="panel wide">

          <div className="panel-title">

            <h2>📡 Current Response Plan</h2>

            {plan && (
              <span className="plan-version">
                PLAN V{plan.version}
              </span>
            )}

          </div>

          {!plan ? (

            <div className="empty">
              No response plan available
            </div>

          ) : (

            <>

              <div className="assignments">

                {plan.assignments.map((assignment) => (

                  <div
                    className="assignment"
                    key={`${assignment.resource_id}-${assignment.incident_id}`}
                  >

                    <div className="assignment-resource">
                      🚑 {assignment.resource_id}
                    </div>

                    <div className="arrow">
                      →
                    </div>

                    <div>

                      <strong>
                        {assignment.incident_id}
                      </strong>

                      <small>
                        ETA {assignment.eta_minutes} min
                        {" • "}
                        {assignment.distance_km} km
                      </small>

                    </div>

                  </div>

                ))}

              </div>

              {plan.hospital_assignments &&
                Object.entries(
                  plan.hospital_assignments
                ).map(([incidentId, hospital]) => (

                  <div
                    className="hospital"
                    key={incidentId}
                  >

                    🏥 <b>{incidentId}</b>
                    {" → "}
                    {hospital.hospital_name}
                    {" • "}
                    {hospital.available_beds} beds available

                  </div>

                ))}

              {plan.shortages.length > 0 && (

                <div className="shortage">
                  ⚠️ {plan.shortages.join(" | ")}
                </div>

              )}

              {plan.approval_required && (

                <div className="approval">

                  <div>

                    <strong>
                      Human Approval Required
                    </strong>

                    <small>
                      Resource allocation changed.
                      Commander review required.
                    </small>

                  </div>

                  <button onClick={approvePlan}>
                    APPROVE PLAN
                  </button>

                </div>

              )}

            </>

          )}

        </section>

        {/* PLAN DIFF */}

        <section className="panel">

          <div className="panel-title">

            <h2>🔄 Plan Diff</h2>

            <span>
              {diff?.diff?.has_changes
                ? "CHANGES DETECTED"
                : "NO CHANGES"}
            </span>

          </div>

          {diff?.diff?.changes?.length > 0 ? (

            <div className="diff-list">

              {diff.diff.changes.map(
                (change, index) => (

                  <div
                    className="diff-item"
                    key={index}
                  >

                    <span className="change-type">
                      {change.type.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                    <strong>
                      {change.from_resource || "—"}
                      {" → "}
                      {change.to_resource || "—"}
                    </strong>

                    <small>
                      {change.message}
                    </small>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="empty">
              No plan changes detected
            </div>

          )}

        </section>

        {/* COMMAND CENTER */}

        <section className="panel">

          <div className="panel-title">
            <h2>🎛️ Command Center</h2>
          </div>

          <textarea
            placeholder="Describe an emergency..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
          />

          <button
            className="primary"
            onClick={createIncident}
            disabled={loading}
          >
            🚨 CREATE INCIDENT
          </button>

          <button
            className="danger"
            onClick={breakdownAmbulance}
            disabled={loading}
          >
            💥 SIMULATE AMB-01 BREAKDOWN
          </button>

          <button
            className="secondary"
            onClick={resetSystem}
            disabled={loading}
          >
            🔄 RESET SIMULATION
          </button>

        </section>

        {/* AUDIT */}

        <section className="panel wide">

          <div className="panel-title">

            <h2>📜 Decision Audit Trail</h2>

            <span>
              {audit.length} events
            </span>

          </div>

          <div className="audit">

            {audit.length === 0 ? (

              <div className="empty">
                No audit events yet
              </div>

            ) : (

              audit
                .slice()
                .reverse()
                .map((event, index) => (

                  <div
                    className="audit-item"
                    key={index}
                  >

                    <span className="audit-dot"></span>

                    <div>

                      <strong>
                        {event.event}
                      </strong>

                      <small>
                        {event.message ||
                          event.decision ||
                          `Plan ${
                            event.new_plan_version || ""
                          }`}
                      </small>

                    </div>

                  </div>

                ))

            )}

          </div>

        </section>

      </main>

      <footer>

        <span>
          Crisis Command
        </span>

        <span>
          Human-in-the-loop Emergency Decision Support
        </span>

      </footer>

    </div>
  );
}

export default App;