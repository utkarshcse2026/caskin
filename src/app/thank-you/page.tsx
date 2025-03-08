import Image from "next/image";

interface PageProps{
    searchParams:{
        [orderId:string]:string|string[]|undefined
    }
}
const Page=({searchParams}:PageProps)=>{
    return(
        <div className='flex flex-col items-center justify-center h-full'>
            <h1 className='text-4xl font-semibold text-zinc-200'>Thank you for your submission!</h1>
            <p className='text-lg text-zinc-500'>We will get back to you soon.</p>
            <p>`{searchParams.orderId}`</p>
        </div>
    )
}
export default Page;