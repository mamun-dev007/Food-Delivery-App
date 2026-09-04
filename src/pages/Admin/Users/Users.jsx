import { useAdminStore } from "../../../store/adminStore";

const statusBadge = {
  Active: "badge-success",
  Inactive: "badge-error",
  Suspended: "badge-warning",
};

const Users = () => {
  const users = useAdminStore((s) => s.users);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Users Management</h1>
      <p className="text-base-content/60 mt-1 mb-6">
        View and manage all customer accounts.
      </p>

      <div className="card bg-base-100 shadow-md overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-semibold">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge badge-ghost">{u.role}</span>
                </td>
                <td>{u.joined}</td>
                <td>
                  <span className={`badge ${statusBadge[u.status]}`}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
