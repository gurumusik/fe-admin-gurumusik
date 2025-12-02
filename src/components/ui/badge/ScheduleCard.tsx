// src/components/ui/card/ScheduleCard.tsx
import React from "react";
import { RiTimeLine, RiMapPin2Line, RiMore2Line } from "react-icons/ri";
import ProgramAvatarBadge from "@/components/ui/badge/ProgramAvatarBadge";
import { getInstrumentIcon } from "@/utils/getInstrumentIcon";
import { capitalizeFirstLetter } from "@/utils/capitalize";
import { getStatusChip } from "@/utils/getStatusChip";
import type { IScheduleCardProps } from "@/interfaces/IDashboardTeacher";

const ScheduleCard: React.FC<IScheduleCardProps> = ({
  avatar,
  name,
  instrument,
  program,
  time,
  location,
  status,
}) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm min-w-[340px]">
      {/* Header: avatar bulat + label program */}
      <div className="flex items-center justify-between gap-3">
        <ProgramAvatarBadge src={avatar} alt={name} pkg={program} size={60} />
        <div className="flex-1">
          <div className="font-semibold leading-tight mb-1">{name}</div>
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-800 leading-tight">
            {/* ganti next/image -> img biasa */}
            <img
              src={getInstrumentIcon(instrument)}
              width={22}
              height={22}
              alt={instrument}
            />
            {capitalizeFirstLetter(instrument)}
          </div>
        </div>
        <RiMore2Line size={25} />
      </div>

      <hr className="my-3 border-neutral-200" />

      <div className="space-y-2 text-[15px] font-medium">
        <div className="flex items-center gap-2">
          <RiTimeLine className="text-[var(--secondary-color)]" size={20} /> {time}
        </div>
        <div className="flex items-center gap-2">
          <RiMapPin2Line className="text-[var(--secondary-color)]" size={20} /> {location}
        </div>
      </div>

      <hr className="my-3 border-neutral-200" />

      <div className="flex items-center gap-2">
        <div className="text-sm text-neutral-900">Status:</div>
        <div className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusChip(status)}`}>
          {status}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;
