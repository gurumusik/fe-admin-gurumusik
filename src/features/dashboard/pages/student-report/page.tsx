// src/features/tutor/pages/TutorReportPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  RiNotification4Fill,
  RiCheckboxCircleFill,
  RiCloseFill,
} from "react-icons/ri";
import Button from "@/components/ui/common/Button";
import {
  type TNotifItem,
  type TNotifKind,
  type TNotifReadFilter,
  type TNotifKindFilter,
} from "@/types/TNotification";
import { notifications } from "@/data/dummyData";
import ApprovalModal from "../../components/ApprovalModal"; 
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";

/*  Helpers  */
const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const kindLabel = (k: TNotifKind) => {
  switch (k) {
    case "reschedule_request":
      return "Pengajuan Reschedule";
    case "reschedule_rejected":
      return "Reschedule Ditolak";
    case "reschedule_approved":
      return "Reschedule Disetujui";
    default:
      return "Notifikasi";
  }
};

function parseNewScheduleFromMessage(msg: string) {
  try {
    const afterColon = msg.split(":")[1]?.trim() || "";
    if (!afterColon) return null;
    const [datePart, timePartRaw] = afterColon.split(/pukul/i);
    const dateLabel = (datePart || "").trim().replace(/\.*$/, "");
    const timeLabel = (timePartRaw || "")
      .replace(/WIB|WITA|WIT/gi, "")
      .trim()
      .replace(/\.*$/, "");
    if (!dateLabel) return null;
    return { dateLabel, timeLabel: timeLabel || "-" };
  } catch {
    return null;
  }
}

type ModalButtonVariant = "primary" | "outline" | "success" | "danger" | "neutral";

export const StudentReportPage: React.FC = () => {
  // sumber data dari dummyData.ts
  const [items, setItems] = useState<TNotifItem[]>(notifications);

  const [q] = useState("");
  const [readFilter] = useState<TNotifReadFilter>("all");
  const [kindFilter] = useState<TNotifKindFilter>("all");

  // state modal approval
  const [openApproval, setOpenApproval] = useState(false);
  const [selected, setSelected] = useState<TNotifItem | null>(null);

  // state modal konfirmasi (success/danger)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTone, setConfirmTone] =
    useState<"success" | "danger" | "neutral">("success");
  const [confirmTitle, setConfirmTitle] = useState<string>("");
  const [confirmTexts, setConfirmTexts] = useState<
    Array<string | React.ReactNode>
  >([]);
  const [confirmButtons, setConfirmButtons] = useState<{
    button1?: { label: string; onClick: () => void; variant?: ModalButtonVariant };
    button2?: { label: string; onClick: () => void; variant?: ModalButtonVariant };
  }>({});

  // slicing: search + filter + urut (unread dulu, terbaru dulu)
  const sliced = useMemo(() => {
    let out = [...items];

    if (readFilter !== "all") {
      out = out.filter((n) => (readFilter === "unread" ? !n.isRead : n.isRead));
    }

    if (kindFilter === "reschedule") {
      const resKinds: TNotifKind[] = [
        "reschedule_request",
        "reschedule_rejected",
        "reschedule_approved",
      ];
      out = out.filter((n) => resKinds.includes(n.kind));
    } else if (kindFilter === "general") {
      out = out.filter((n) => n.kind === "general");
    }

    const qq = q.trim().toLowerCase();
    if (qq) {
      out = out.filter((n) => {
        const hay =
          (n.title || "") +
          " " +
          n.message +
          " " +
          (n.studentName || "") +
          " " +
          kindLabel(n.kind);
        return hay.toLowerCase().includes(qq);
      });
    }

    out.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return out;
  }, [items, q, readFilter, kindFilter]);

  const markAllAsRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));

  // Klik detail
  const onClickDetail = (id: TNotifItem["id"]) => {
    const notif = items.find((n) => n.id === id);
    if (!notif) return;

    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    if (
      notif.kind === "reschedule_request" ||
      notif.kind === "reschedule_approved" ||
      notif.kind === "reschedule_rejected"
    ) {
      setSelected(notif);
      setOpenApproval(true);
    }
  };

  useEffect(() => {}, []);

  const toSched = selected ? parseNewScheduleFromMessage(selected.message) : null;

  //  Handler TERIMA (success / error)
  async function handleApprove(shouldError = false) {
    try {
      await new Promise((r) => setTimeout(r, 250));
      if (shouldError) throw new Error("fail-approve");

      setConfirmTone("success");
      setConfirmTitle("Jadwal Baru Telah Dikonfirmasi");
      setConfirmTexts(["Jadwal mu udah diatur ulang. Cek jadwal barunya, ya!"]);
      setConfirmButtons({
        button1: {
          label: "Kembali",
          variant: "outline",
          onClick: () => setConfirmOpen(false),
        },
      });
      setConfirmOpen(true);
    } catch {
      setConfirmTone("danger");
      setConfirmTitle("Ups, Jadwal Nggak Bisa Diubah");
      setConfirmTexts([
        "Ada masalah pas nerima jadwal baru. Coba lagi nanti atau chat Admin.",
      ]);
      setConfirmButtons({
        button2: {
          label: "Kembali",
          variant: "outline",
          onClick: () => setConfirmOpen(false),
        },
        button1: {
          label: "Hubungi Admin",
          variant: "primary",
          onClick: () => setConfirmOpen(false),
        },
      });
      setConfirmOpen(true);
    }
  }

  //  Handler SUBMIT REASON (success / error)
  async function handleSubmitReason(_reason: string, shouldError = false) {
    setOpenApproval(false);
    try {
      await new Promise((r) => setTimeout(r, 250));
      if (shouldError) throw new Error("fail-reason");

      setConfirmTone("success");
      setConfirmTitle("Penolakan Jadwal Terkirim");
      setConfirmTexts([
        "Guru sudah menerima alasanmu. Kamu bisa tunggu respon atau atur jadwal lain bareng guru.",
      ]);
      setConfirmButtons({
        button1: {
          label: "Kembali",
          variant: "outline",
          onClick: () => setConfirmOpen(false),
        },
      });
      setConfirmOpen(true);
    } catch {
      setConfirmTone("danger");
      setConfirmTitle("Ups, Penolakan Gagal");
      setConfirmTexts([
        "Ada masalah pas ngirim penolakanmu. Coba lagi nanti atau hubungi Admin",
      ]);
      setConfirmButtons({
        button2: {
          label: "Kembali",
          variant: "outline",
          onClick: () => setConfirmOpen(false),
        },
        button1: {
          label: "Hubungi Admin",
          variant: "primary",
          onClick: () => setConfirmOpen(false),
        },
      });
      setConfirmOpen(true);
    }
  }

  // = Konfigurasi ApprovalModal per kind terpilih =
  const isReq = selected?.kind === "reschedule_request";
  const isApproved = selected?.kind === "reschedule_approved";
  const isRejected = selected?.kind === "reschedule_rejected";

  return (
    <>
      <div className="relative min-h-[89vh] pt-1">
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-11 h-11 rounded-full bg-[var(--accent-purple-color)] flex items-center justify-center">
              <RiNotification4Fill className="text-[#fff]" size={25} />
            </div>
            <h2 className="font-semibold text-lg">Student Report</h2>
            <div className="ml-auto">
              <Button
                color="secondaryLine"
                className="text-sm"
                onClick={markAllAsRead}
              >
                Tandai Semua Dibaca
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="rounded-lg overflow-hidden bg-white p-5 pt-0">
            {sliced.length === 0 ? (
              <div className="py-10 text-center text-neutral-400">
                Tidak ada notifikasi.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-300">
                {sliced.map((n) => {
                  const showDetail = n.kind !== "general"; // kind general: tidak ada button Detail
                  const rowBgClass = n.isRead
                    ? "bg-[var(--secondary-light-color)]/60"
                    : "bg-white";

                  return (
                    <li
                      key={n.id}
                      className={cls(
                        "px-5 py-4 flex items-start gap-4 transition-colors",
                        rowBgClass
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-md">
                            {n.title ? n.title : kindLabel(n.kind)}{" "}
                            {n.studentName ? <>&lt;{n.studentName}&gt;</> : null}
                          </p>
                          {!n.isRead && (
                            <span className="inline-flex items-center rounded-full bg-[var(--secondary-color)] text-white text-[10px] font-semibold px-2 py-[2px]">
                              New
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-md text-neutral-600">
                          {n.message}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {showDetail ? (
                          <Button
                            color="secondaryLine"
                            className="text-sm"
                            onClick={() => onClickDetail(n.id)}
                          >
                            Detail
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/*  Modal Approval / Reason (tergantung kind)  */}
      {selected && (
        <ApprovalModal
          isOpen={openApproval}
          onClose={() => setOpenApproval(false)}
          // mode:
          mode={isRejected ? "reason" : "approval"}
          student={{
            name: selected.studentName || "Murid",
            avatarUrl: "/assets/images/profile.png",
            package: "Reguler",
            instrument: "Vocal",
          }}
          // jadwal lama belum ada pada dummy dari placeholder
          from={{ dateLabel: "-", timeLabel: "-" }}
          // jadwal baru coba diambil dari message notif
          to={{
            dateLabel: toSched?.dateLabel ?? "-",
            timeLabel: toSched?.timeLabel ?? "-",
          }}
          // KASUS: request
          {...(isReq && {
            showActionButtons: true,
            rejectBtn: { label: "Tolak", variant: "outline" },
            approveBtn: {
              label: "Terima",
              variant: "primary",
              onClick: () => {
                // ubah ke true untuk simulasi error approve
                handleApprove(false);
                setOpenApproval(false);
              },
            },
            onSubmitReason: (txt: string) => {
              // ubah ke true untuk simulasi error reason
              handleSubmitReason(txt, false);
            },
            showSubmitButton: true,
            submitButton: { label: "Kirim Penolakan", variant: "primary" },
          })}
          // KASUS: approved
          {...(isApproved && {
            showActionButtons: true,
            rejectBtn: null, // tidak ada tombol Tolak
            approveBtn: {
              label: "Kembali",
              variant: "outline",
              onClick: () => setOpenApproval(false),
            },
          })}
          // KASUS: rejected
          {...(isRejected && {
            reasonReadOnly: true,
            reasonValue: "",
            onSubmitReason: () => setOpenApproval(false),
            showSubmitButton: true,
            submitButton: { label: "Kembali", variant: "outline" },
          })}
        />
      )}

      {/* Modal confirm */}
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        icon={
          confirmTone === "success" ? <RiCheckboxCircleFill /> : <RiCloseFill />
        }
        iconTone={confirmTone}
        title={confirmTitle}
        texts={confirmTexts}
        align="center"
        button1={
          confirmButtons.button1 && {
            label: confirmButtons.button1.label,
            onClick: confirmButtons.button1.onClick,
            variant: confirmButtons.button1.variant,
          }
        }
        button2={
          confirmButtons.button2 && {
            label: confirmButtons.button2.label,
            onClick: confirmButtons.button2.onClick,
            variant: confirmButtons.button2.variant,
          }
        }
        widthClass="max-w-lg"
      />
    </>
  );
};

export default StudentReportPage;
