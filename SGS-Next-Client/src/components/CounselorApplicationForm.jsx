import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Button from './Button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import authService from '../services/authService'
import toast from 'react-hot-toast'

const CounselorApplicationForm = ({ categories }) => {

    const { user } = useSelector(state => state.auth)
    const queryClient = useQueryClient()

    const { data, isPending, isSuccess, isError, error, mutate } = useMutation({
        mutationFn: (credentials) => authService.becomeCounselor(credentials),
        onSuccess: (resData) => {
            toast.success(resData?.message || "Application submitted successfully!")
            queryClient.invalidateQueries({ queryKey: ["my-counselor-application"] })
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to submit application")
        }
    })

    const [formData, setFormData] = useState({
        category: categories?.[0]?._id || "",
        experience: 3,
        phone: user?.phone || "",
        bio: user?.bio || ""
    })

    const { category, experience, phone, bio } = formData

    useEffect(() => {
        if (categories && categories.length > 0 && !formData.category) {
            setFormData(prev => ({ ...prev, category: categories[0]._id }))
        }
    }, [categories])

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                phone: prev.phone || user.phone || "",
                bio: prev.bio || user.bio || ""
            }))
        }
    }, [user])

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        mutate({
            token: user.token,
            category: category || categories?.[0]?._id,
            experience: Number(experience) || 3,
            phone: phone || user?.phone || "",
            bio: bio || ""
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        defaultValue={user?.name}
                        placeholder="e.g. Vikramaditya Singh"
                        className="disabled:bg-gray-200 w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                        disabled
                    />
                </div>

                <div>
                    <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                        Qualification
                    </label>
                    <input
                        type="text"
                        defaultValue={user?.qualification || "Industry Professional"}
                        placeholder="e.g. Lead Designer @ Swiggy"
                        className="disabled:bg-gray-200 w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                        disabled
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                        Email
                    </label>
                    <input
                        type="text"
                        defaultValue={user?.email}
                        placeholder="john@gmail.com"
                        className="disabled:bg-gray-200 w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                        disabled
                    />
                </div>

                <div>
                    <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                        Contact Phone
                    </label>
                    <input
                        type="text"
                        name="phone"
                        value={phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                        Years of Industry Experience
                    </label>
                    <select
                        name='experience'
                        value={experience}
                        onChange={handleChange}
                        className="w-full bg-parchment border-3 border-navy rounded-xl px-3 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                    >
                        <option value={3}>3 - 5 Years</option>
                        <option value={6}>6 - 10 Years</option>
                        <option value={10}>10+ Years</option>
                    </select>
                </div>

                <div>
                    <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                        Primary Domain Expertise
                    </label>
                    <select
                        name='category'
                        value={category}
                        onChange={handleChange}
                        className="w-full bg-parchment border-3 border-navy rounded-xl px-3 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                    >
                        {categories?.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                    Mentorship Bio & Philosophy
                </label>
                <textarea
                    name="bio"
                    rows={3}
                    value={bio}
                    onChange={handleChange}
                    placeholder="Share your mentorship background, key achievements, and how you guide students..."
                    className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none resize-none"
                />
            </div>

            <div className="pt-4 border-t-2 border-navy/20">
                <Button type='submit' variant="accent" size="lg" className="w-full" disabled={isPending}>
                    {isPending ? "SUBMITTING APPLICATION..." : "SUBMIT COUNSELOR APPLICATION →"}
                </Button>
            </div>
        </form>
    )
}

export default CounselorApplicationForm
