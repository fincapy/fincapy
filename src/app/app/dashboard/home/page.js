import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default async function Dashboard() {
  return (
    <div className="flex flex-col w-full flex-grow">
      <div className="flex flex-row justify-center">
        <Card className="w-10/12 lg:w-1/2">
          <CardHeader>
            <CardTitle>Category</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row gap-2 items-center">
              <span className="font-sans">$0</span>
              <Progress value={50} />
              <span className="font-sans">$100</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
