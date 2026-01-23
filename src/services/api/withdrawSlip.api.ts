import { baseUrl } from "@/services/http/url";
import { ENDPOINTS } from "@/services/endpoints";

export type WithdrawSlipDTO = {
  slip_no: string;
  terbilang?: string | null;
  untuk: {
    id_guru: string;
    guru: string;
    email: string;
    no_telp: string | null;
    alamat: string | null;
  };
  periode: {
    start: string | null;
    end: string | null;
  };
  tanggal_pencairan: string | null;
  pendapatan: {
    komisi_kelas: number;
    pendapatan_modul: number;
    bonus: number;
    total_A: number;
  };
  potongan: {
    pph21: number;
    denda: number;
    transfer_fee: number;
    platform_fee: number;
    lainnya: number;
    total_B: number;
  };
  penerimaan_bersih: number | null;
  payout: {
    id: number;
    type: string;
    status: string;
    status_code: string;
    amount_requested: number;
    amount_paid: number | null;
    bank?: {
      bank_name?: string | null;
      account_number?: string | null;
      account_name?: string | null;
    };
    reference?: string | null;
  };
};

export async function getWithdrawSlipGuru(id: number | string) {
  return baseUrl.request<WithdrawSlipDTO>(ENDPOINTS.WITHDRAW.SLIP(id), {
    method: "GET",
  });
}
