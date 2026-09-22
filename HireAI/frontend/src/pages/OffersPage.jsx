import { Link } from "react-router-dom";
import { Check, FileText, CalendarDays } from "lucide-react";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";

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
      <div className="grid3">
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
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Role</th>
              <th>CTC</th>
              <th>Sent On</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.name}>
                <td>{offer.name}</td>
                <td>{offer.role}</td>
                <td>{offer.ctc}</td>
                <td>{offer.sent}</td>
                <td>{offer.exp}</td>
                <td>
                  <span
                    className={`badge ${offer.status === "Accepted" ? "badge-green" : offer.status === "Pending" ? "badge-orange" : "badge-red"}`}
                  >
                    {offer.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
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
