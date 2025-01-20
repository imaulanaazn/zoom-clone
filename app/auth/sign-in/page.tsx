import Image from "next/image";

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL;

export default function SiginInPage() {
  return (
    <main className="flex h-screen w-full items-center justify-center">
      <div className=" flex h-96 flex-col items-center justify-center rounded-xl bg-white p-28">
        <div className="flex items-center gap-3">
          <Image
            src={"/icons/logo.svg"}
            alt={"zoom logo"}
            width={50}
            height={50}
          />
          <h2 className="font-bold text-4xl">Convin</h2>
        </div>
        <h1 className="mt-6 text-xl font-bold">Login untuk melanjutkan</h1>
        <p className="mb-10 mt-2 text-sm">
          Klik tombol authorize untuk menghubungkan akun zoom
        </p>
        <a
          href={`https://zoom.us/oauth/authorize?response_type=code&client_id=OJ6QysNcQLKVN8XkB1DY8A&redirect_uri=${FRONTEND_URL}/redirect`}
          className="w-max rounded-md bg-violet-500 px-4 py-2 text-white"
        >
          Authorize
        </a>
      </div>
    </main>
  );
}
