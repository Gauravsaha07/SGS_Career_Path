import React from 'react'
import Button from './Button'
import StatusBadge from './StatusBadge'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import adminService from '../services/adminService'
import { setApprovals } from '../features/admin/adminSlice'

const ApprovalCard = ({ app }) => {
    const dispatch = useDispatch()
    const queryClient = useQueryClient()
    const { user } = useSelector(state => state.auth)

    const { mutate, isPending } = useMutation({
        mutationFn: (credentials) => adminService.updateCounselor(credentials),
        onSuccess: (data, variables) => {
            dispatch(setApprovals(data))
            queryClient.invalidateQueries({ queryKey: ["admin"] })
            queryClient.invalidateQueries({ queryKey: ["counselor"] })
            queryClient.invalidateQueries({ queryKey: ["counselors"] })
            if (variables.status === "accepted") {
                toast.success("Counselor approved! Profile verified and promoted to Counselor.")
            } else {
                toast.success("Counselor application rejected.")
            }
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "An error occurred")
        }
    })

    const handleUpdate = (status, id) => {
        mutate({
            token: user.token,
            crid: id,
            status: status
        })
    }

    const name = app?.user?.name || app?.name || "Applicant (User Deleted)"
    const email = app?.user?.email || app?.email || "No email available"
    const phone = app?.user?.phone || app?.phone || null
    const location = app?.user?.location || app?.location || "India"
    const qualification = app?.user?.qualification || app?.qualification || "Industry Professional"
    const profilePic = app?.user?.profilePic || app?.profilePic || null
    const categoryTitle = app?.category?.title || app?.category?.name || app?.categoryTitle || "Career Mentorship"
    const experience = app?.experience ? `${app.experience} Years Experience` : "3+ Years Experience"
    const bio = app?.bio || app?.user?.bio || null
    const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "A"

    return (
        <div className={app?.status === "rejected" ? "bg-red-50 border-4 border-navy rounded-3xl p-6 shadow-pop" : "bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop"}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b-2 border-navy/20">
                <div className="flex items-start space-x-4">
                    {profilePic ? (
                        <img
                            src={profilePic}
                            alt={name}
                            className="w-14 h-14 rounded-2xl border-3 border-navy object-cover shadow-pop-sm shrink-0"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-2xl border-3 border-navy bg-yellow flex items-center justify-center font-grotesk font-extrabold text-navy text-xl shadow-pop-sm shrink-0">
                            {initials}
                        </div>
                    )}

                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="font-grotesk font-extrabold text-xl text-navy">{name}</h2>
                            <StatusBadge
                                text={app?.status || "pending"}
                                status={app?.status === "accepted" ? "success" : app?.status === "rejected" ? "danger" : "warning"}
                            />
                        </div>
                        <p className="font-mono text-xs font-bold text-navy-muted mt-0.5">
                            🏷️ {categoryTitle} • ⏳ {experience} • 📍 {location}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-navy mt-1">
                            <span className="text-rust">🔗 {email}</span>
                            {phone && <span className="text-teal font-bold">📞 {phone}</span>}
                        </div>
                    </div>
                </div>

                <div className="font-mono text-xs font-bold text-navy bg-yellow px-3.5 py-1.5 rounded-full border-2 border-navy shadow-pop-sm shrink-0">
                    🎓 {qualification}
                </div>
            </div>

            {bio && (
                <div className="mb-4 p-3.5 bg-parchment border-2 border-navy/30 rounded-xl">
                    <span className="font-mono text-[10px] uppercase font-bold text-navy-muted">Mentorship Bio & Philosophy:</span>
                    <p className="font-body text-xs text-navy mt-1 italic">"{bio}"</p>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="font-mono text-[11px] text-navy-muted">
                    Applied on: {app?.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                </span>

                <div className="flex space-x-3">
                    {app?.status === "pending" && (
                        <Button
                            clickAction={() => handleUpdate("rejected", app._id)}
                            variant="accent"
                            size="sm"
                            disabled={isPending}
                        >
                            {isPending ? "Updating..." : "Reject Application"}
                        </Button>
                    )}
                    {app?.status !== "accepted" && (
                        <Button
                            clickAction={() => handleUpdate("accepted", app._id)}
                            variant="primary"
                            size="sm"
                            disabled={isPending}
                        >
                            {isPending ? "Updating..." : "Approve & Issue Badge ✓"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ApprovalCard
