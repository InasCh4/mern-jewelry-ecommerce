import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const AdminCustomers = () => {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await api.get("/users");

      setUsersList(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = useMemo(() => {
    return {
      total: usersList.length,
      customers: usersList.filter((user) => user.role === "user").length,
      admins: usersList.filter((user) => user.role === "admin").length,
      verified: usersList.filter((user) => user.isEmailVerified).length,
    };
  }, [usersList]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return usersList;

    return usersList.filter((user) => {
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.defaultAddress?.wilaya?.toLowerCase().includes(query) ||
        user.defaultAddress?.commune?.toLowerCase().includes(query)
      );
    });
  }, [usersList, searchQuery]);

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading customers...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">
              Customers
            </h1>

            <p className="mt-3 text-stone-500">
              View registered users, customer details, and account status.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-stone-100 text-stone-950">
              <Users size={20} />
            </div>

            <p className="mt-5 text-sm text-stone-500">Total accounts</p>

            <h2 className="mt-2 text-3xl font-bold text-stone-950">
              {stats.total}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-blue-600">
              <User size={20} />
            </div>

            <p className="mt-5 text-sm text-stone-500">Customers</p>

            <h2 className="mt-2 text-3xl font-bold text-stone-950">
              {stats.customers}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-stone-950 text-white">
              <ShieldCheck size={20} />
            </div>

            <p className="mt-5 text-sm text-stone-500">Admins</p>

            <h2 className="mt-2 text-3xl font-bold text-stone-950">
              {stats.admins}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-green-50 text-green-600">
              <Mail size={20} />
            </div>

            <p className="mt-5 text-sm text-stone-500">Verified emails</p>

            <h2 className="mt-2 text-3xl font-bold text-stone-950">
              {stats.verified}
            </h2>
          </div>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-stone-950">
                Customer List
              </h2>

              <p className="mt-1 text-stone-500">
                Showing {filteredUsers.length} of {usersList.length} accounts.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-11 py-3 outline-none focus:border-stone-900"
                placeholder="Search name, email, phone, wilaya..."
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-stone-400">
                  <th className="w-[260px] py-4 pr-5 font-medium">Customer</th>
                  <th className="w-[230px] py-4 pr-5 font-medium">Contact</th>
                  <th className="w-[240px] py-4 pr-5 font-medium">Address</th>
                  <th className="w-[120px] py-4 pr-5 font-medium">Role</th>
                  <th className="w-[150px] py-4 pr-5 font-medium">Provider</th>
                  <th className="w-[160px] py-4 text-right font-medium">
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-t border-stone-100 text-sm"
                  >
                    <td className="py-5 pr-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-stone-950 text-sm font-bold uppercase text-white">
                          {customer.name?.charAt(0) || "U"}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold text-stone-950">
                            {customer.name}
                          </p>

                          <p className="mt-1 max-w-[210px] truncate text-xs text-stone-400">
                            #{customer._id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-5 pr-5">
                      <p className="flex items-center gap-2 font-medium text-stone-950">
                        <Mail size={15} />
                        <span className="max-w-[190px] truncate">
                          {customer.email}
                        </span>
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-stone-500">
                        <Phone size={15} />
                        {customer.phone || "No phone"}
                      </p>
                    </td>

                    <td className="py-5 pr-5">
                      <p className="flex items-start gap-2 text-stone-600">
                        <MapPin size={15} className="mt-0.5 shrink-0" />

                        <span>
                          {customer.defaultAddress?.wilaya ||
                          customer.defaultAddress?.commune ||
                          customer.defaultAddress?.address
                            ? `${customer.defaultAddress?.wilaya || ""} ${
                                customer.defaultAddress?.commune || ""
                              } ${customer.defaultAddress?.address || ""}`
                            : "No default address"}
                        </span>
                      </p>
                    </td>

                    <td className="py-5 pr-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          customer.role === "admin"
                            ? "bg-stone-950 text-white"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {customer.role}
                      </span>
                    </td>

                    <td className="py-5 pr-5">
                      <p className="capitalize text-stone-700">
                        {customer.authProvider || "local"}
                      </p>

                      <p
                        className={`mt-1 text-xs ${
                          customer.isEmailVerified
                            ? "text-green-600"
                            : "text-stone-400"
                        }`}
                      >
                        {customer.isEmailVerified ? "Verified" : "Not verified"}
                      </p>
                    </td>

                    <td className="py-5 text-right text-stone-500">
                      {customer.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString(
                            "en-GB",
                          )
                        : "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="py-12 text-center">
                <Users size={34} className="mx-auto text-stone-300" />

                <p className="mt-3 text-stone-500">
                  No customers match this search.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminCustomers;
