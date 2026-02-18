import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
        Hibi No ToDo's
      </h1>
      <p className="text-gray-400 mt-2">Your daily tasks, simplified and elegant.</p>
    </header>
  );
};

export default Header;
