import { TodoList } from '../components/TodoList';

export const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-forest-50 p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-forest-900">Todo App</h2>
        <p className="text-forest-700">
          Manage your tasks with full CRUD operations
        </p>
      </div>

      <TodoList />
    </div>
  );
};
