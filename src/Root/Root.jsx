import { Outlet } from 'react-router';
import Navbar from './../components/Navbar/Navbar';
import Footer from './../components/Footer/Footer';


const Root = () => {

  
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className='max-w-7xl w-full mx-auto px-4 lg:px-8 flex-1'>
                <Outlet />
            </div>

            <Footer />
        </div>
    );
};

export default Root;