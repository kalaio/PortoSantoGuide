"use client";

import { Clock, MarkerPin02 } from "@untitledui/icons";
import type { BadgeColors } from "@/components/base/badges/badge-types";

type JobCardNakedProps = { title: string; description: string; href: string; location: string; type: string; badgeText?: string; badgeColor: BadgeColors };

const JobCardNaked = (props: JobCardNakedProps) => {
    return (
        <a
            href={props.href}
            className="-mt-px flex flex-col rounded-xs border-t border-brand_alt pt-6 outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-4"
        >
            <h3 className="text-md font-semibold text-primary_on-brand">{props.title}</h3>
            <p className="mt-2 text-md text-tertiary_on-brand">{props.description}</p>
            <div className="mt-5 flex gap-4">
                <div className="flex items-center gap-1.5">
                    <MarkerPin02 size={20} className="text-icon-fg-brand_on-brand" />
                    <span className="text-sm font-medium text-tertiary_on-brand">{props.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={20} className="text-icon-fg-brand_on-brand" />
                    <span className="text-sm font-medium text-tertiary_on-brand">{props.type}</span>
                </div>
            </div>
        </a>
    );
};

const jobs: JobCardNakedProps[] = [
    {
        title: "Product Designer",
        description: "We're looking for a mid-level product designer to join our team.",
        href: "#",
        badgeColor: "blue",
        badgeText: "Design",
        location: "Remote",
        type: "Full-time",
    },
    {
        title: "Engineering Manager",
        description: "We're looking for an experienced engineering manager to join our team.",
        href: "#",
        badgeColor: "pink",
        badgeText: "Software Development",
        location: "Remote",
        type: "Full-time",
    },
    {
        title: "Customer Success Manager",
        description: "We're looking for a customer success manager to join our team.",
        href: "#",
        badgeColor: "success",
        badgeText: "Customer Success",
        location: "Remote",
        type: "Full-time",
    },
    {
        title: "Account Executive",
        description: "We're looking for an account executive to join our team.",
        href: "#",
        badgeColor: "indigo",
        badgeText: "Sales",
        location: "Remote",
        type: "Full-time",
    },
    {
        title: "SEO Marketing Manager",
        description: "We're looking for an experienced SEO marketing manager to join our team.",
        href: "#",
        badgeColor: "orange",
        badgeText: "Marketing",
        location: "Remote",
        type: "Full-time",
    },
    {
        title: "UX Researcher",
        description: "We're looking for a senior user researcher to join our team.",
        href: "#",
        badgeColor: "orange",
        badgeText: "Marketing",
        location: "Remote",
        type: "Full-time",
    },
];

export const CareersSimple01Brand = () => {
    return (
        <section className="bg-brand-section py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary_on-brand md:text-display-md">Open positions</h2>
                    <p className="mt-4 text-lg text-tertiary_on-brand md:mt-5 md:text-xl">We're a 100% remote team spread all across the world. Join us!</p>
                </div>

                <div className="mx-auto mt-12 max-w-3xl md:mt-16">
                    <ul className="flex flex-col gap-8">
                        {jobs.slice(0, -1).map((job) => (
                            <li key={job.title}>
                                <JobCardNaked {...job} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};
