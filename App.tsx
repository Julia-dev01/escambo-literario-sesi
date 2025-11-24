import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { BookDetail } from './components/BookDetail';
import { UserDashboard } from './components/UserDashboard';
import { AdminPanel } from './components/AdminPanel';
import { DonateBook } from './components/DonateBook';

/* ---------------------------------------------------------
   Tipos utilizados em todo o sistema
--------------------------------------------------------- */

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  credits: number;
  avatar?: string;
  favorites?: string[];
};

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  cover: string;
  status: 'available' | 'reserved' | 'exchanged';
  donorId: string;
  reservedBy?: string;
  condition: string;
  rating?: number;
};

export type Transaction = {
  id: string;
  userId: string;
  bookId: string;
  type: 'donation' | 'reservation' | 'exchange';
  credits: number;
  date: string;
  bookTitle: string;
};

type Page = 'home' | 'login' | 'book' | 'dashboard' | 'admin' | 'donate';

/* ---------------------------------------------------------
   Aplicação principal
--------------------------------------------------------- */

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  /* ---------------------------------------------------------
     Carregamento inicial de dados (localStorage + mock)
  --------------------------------------------------------- */
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    const savedBooks = localStorage.getItem('books');

    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    } else {
      // Caso não exista nada salvo, carregamos os livros mockados
      const initialBooks: Book[] = [/* ... SEUS LIVROS ... */];
      setBooks(initialBooks);
      localStorage.setItem('books', JSON.stringify(initialBooks));
    }

    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
  }, []);

  /* ---------------------------------------------------------
     Salvando alterações no localStorage
  --------------------------------------------------------- */
  useEffect(() => {
    if (currentUser)
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  /* ---------------------------------------------------------
     Funções de navegação
  --------------------------------------------------------- */

  const navigateTo = (page: Page) => setCurrentPage(page);

  /* ---------------------------------------------------------
     Autenticação
  --------------------------------------------------------- */

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigateTo('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    navigateTo('home');
  };

  /* ---------------------------------------------------------
     Ações com livros
  --------------------------------------------------------- */

  const handleViewBook = (bookId: string) => {
    setSelectedBookId(bookId);
    navigateTo('book');
  };

  const handleReserveBook = (bookId: string) => {
    if (!currentUser) return;

    const book = books.find(b => b.id === bookId);
    if (!book || book.status !== 'available' || currentUser.credits < 1) return;

    // Atualiza o status do livro
    const updatedBooks = books.map(b =>
      b.id === bookId
        ? { ...b, status: 'reserved', reservedBy: currentUser.id }
        : b
    );

    // Atualiza créditos do usuário
    const updatedUser = {
      ...currentUser,
      credits: currentUser.credits - 1,
    };

    // Cria o registro da transação
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      userId: currentUser.id,
      bookId,
      type: 'reservation',
      credits: -1,
      date: new Date().toISOString(),
      bookTitle: book.title,
    };

    setBooks(updatedBooks);
    setCurrentUser(updatedUser);
    setTransactions([...transactions, newTransaction]);
  };

  const handleDonateBook = (
    book: Omit<Book, 'id' | 'donorId' | 'status'>
  ) => {
    if (!currentUser) return;

    const newBook: Book = {
      ...book,
      id: Date.now().toString(),
      donorId: currentUser.id,
      status: 'available',
    };

    const updatedUser = {
      ...currentUser,
      credits: currentUser.credits + 2,
    };

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      userId: currentUser.id,
      bookId: newBook.id,
      type: 'donation',
      credits: 2,
      date: new Date().toISOString(),
      bookTitle: newBook.title,
    };

    setBooks([...books, newBook]);
    setCurrentUser(updatedUser);
    setTransactions([...transactions, newTransaction]);
    navigateTo('home');
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks(books.map(b => (b.id === updatedBook.id ? updatedBook : b)));
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(books.filter(b => b.id !== bookId));
  };

  /* ---------------------------------------------------------
     Renderização da página selecionada
  --------------------------------------------------------- */

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;

      case 'book':
        return (
          <BookDetail
            book={books.find(b => b.id === selectedBookId)!}
            currentUser={currentUser}
            onReserve={handleReserveBook}
            onBack={() => navigateTo('home')}
          />
        );

      case 'dashboard':
        return (
          <UserDashboard
            user={currentUser!}
            books={books}
            transactions={transactions}
          />
        );

      case 'admin':
        return (
          <AdminPanel
            books={books}
            onUpdateBook={handleUpdateBook}
            onDeleteBook={handleDeleteBook}
          />
        );

      case 'donate':
        return (
          <DonateBook
            onDonate={handleDonateBook}
            onCancel={() => navigateTo('home')}
          />
        );

      default:
        return <HomePage books={books} onViewBook={handleViewBook} />;
    }
  };

  /* ---------------------------------------------------------
     Layout final
  --------------------------------------------------------- */

  return (
    <div className="min-h-screen">
      <Header
        currentUser={currentUser}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />
      <main>{renderPage()}</main>
    </div>
  );
}
