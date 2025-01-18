import Image from 'next/image';

export default function SiginInPage() {
  return (
    <main className="flex h-screen w-full items-center justify-center">
      <div className=" flex h-96 flex-col items-center justify-center rounded-xl bg-white p-28">
        <Image
          src={'/images/zoom-logo.png'}
          alt={'zoom logo'}
          width={200}
          height={100}
        />
        <h1 className="mt-6 text-xl font-bold">LOGIN TO YOOM</h1>
        <p className="mb-10 mt-2 text-sm">
          Login using your zoom account to continue using this website
        </p>
        <a
          href="https://zoom.us/oauth/authorize?response_type=code&client_id=OJ6QysNcQLKVN8XkB1DY8A&redirect_uri=http://localhost:3000/redirect"
          className="w-max rounded-md bg-blue-600 px-4 py-2 text-white"
        >
          Authorize
        </a>
      </div>
    </main>
  );
}
