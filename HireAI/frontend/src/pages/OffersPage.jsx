import { Link } from "react-router-dom";
import { Check, FileText, CalendarDays } from "lucide-react";
import PageShell from "../components/common/PageShell";
import StatCard from "../components/common/StatCard";

const CheckIcon = (props) => <Check {...props} />;
const CalendarIcon = (props) => <CalendarDays {...props} />;
const OffersIcon = (props) => <FileText {...props} />;

const offers = [
  {
    name: "Rahul Kumar",
    role: "DevOps Engineer",
    ctc: "₹22 LPA",
    sent: "Dec 18",
    exp: "Dec 25",
    status: "Accepted",
  },
  {
    name: "Priya Sharma",
    role: "Senior Frontend Dev",
    ctc: "₹20 LPA",
    sent: "Dec 20",
    exp: "Dec 27",
    status: "Pending",
  },
  {
    name: "Arjun Mehta",
    role: "Full Stack Dev",
    ctc: "₹18 LPA",
    sent: "Dec 15",
    exp: "Dec 22",
    status: "Pending",
  },
];

function OffersPage() {
  return (
    <PageShell title="Offer Letters" active="offers">
      <div className="grid3 offer-kpi-grid [display:grid] [grid-template-columns:repeat(3,_1fr)] [gap:14px] [margin-bottom:28px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
        <StatCard
          label="Offers Sent"
          value="4"
          icon={<OffersIcon size={18} />}
          color="brand"
        />
        <StatCard
          label="Accepted"
          value="1"
          icon={<CheckIcon size={18} />}
          color="green"
        />
        <StatCard
          label="Awaiting Response"
          value="2"
          icon={<CalendarIcon size={18} />}
          color="orange"
        />
      </div>
      <div className="card table-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [padding:0] [overflow:hidden]">
        <table className="[width:100%] [border-collapse:collapse]">
          <thead>
            <tr>
              <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Candidate</th>
              <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Role</th>
              <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">CTC</th>
              <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Sent On</th>
              <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Expires</th>
              <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Status</th>
              <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.name}>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">{offer.name}</td>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">{offer.role}</td>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">{offer.ctc}</td>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">{offer.sent}</td>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">{offer.exp}</td>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                  <span
                    className={`${(`badge ${offer.status === "Accepted" ? "badge-green" : offer.status === "Pending" ? "badge-orange" : "badge-red"}`)} [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block] [&.badge-green]:[background:#dcfce7] [&.badge-green]:[color:#166534] [&.badge-red]:[background:#fee2e2] [&.badge-red]:[color:#991b1b] [&.badge-orange]:[background:#fef3c7] [&.badge-orange]:[color:#92400e]`}
                  >
                    {offer.status}
                  </span>
                </td>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:transparent] [color:#64748b] [border:1px_solid_#e2e8f0] [padding:6px_14px] [font-size:12px]"
                    disabled
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export default OffersPage;
