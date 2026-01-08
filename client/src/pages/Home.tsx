import { TodoList } from '../components/TodoList';

export const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-forest-50 p-6 shadow-sm">
        <p className="text-forest-700">
          Manage your tasks with full CRUD operations
        </p>
      </div>

      <TodoList />
    </div>
  );
};
