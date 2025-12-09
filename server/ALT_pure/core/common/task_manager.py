import asyncio
from ALT_pure.log.load_log import logger
from typing import List, Any, Callable, Optional
import uuid
TAG=__name__

class TaskGroup:
    group_id:str
    items:List[Any]
    cancel_event:asyncio.Event
    def __init__(self,items:List[Any],g_id:str=None):
        self.logger=logger.bind(tag=TAG)
        self.group_id=str(uuid.uuid4())[:8] if g_id is None else g_id
        self.items=items
        self.cancel_event=asyncio.Event()
        self.completion_event=asyncio.Event()
        self.results={}
        self.completed_count=0

    def cancel(self):
        self.logger.info(f"任务组 {self.group_id}被取消")
        self.cancel_event.set()

    async def is_cancelled(self):
        return self.cancel_event.is_set()

    def set_completed(self):
        self.completion_event.set()

    async def wait_for_completion(self):
        await self.completion_event.wait()

    def add_item(self,item:Any):
        self.items.append(item)

    def add_result(self,item:Any,result:Any):
        try:
            index=self.items.index(item)
            self.results[index]=result
            self.completed_count+=1
        except ValueError:
            self.logger.warning(f"未能找到任务项 {item} 在任务组 {self.group_id} 中的位置")

    def get_results(self):
        ordered_results = []
        for i in range(len(self.items)):
            if i in self.results:
                ordered_results.append(self.results[i])
            else:
                ordered_results.append(None)
        return ordered_results


class TaskManager:
    def __init__(self,worker:Callable,max_workers:int=3,single:bool=True):
        self.logger=logger.bind(tag=TAG)
        self.worker=worker
        # max_workers最大并发量
        self.max_workers=max_workers

        self.queue=asyncio.Queue()
        self.task_groups={}
        self.completed_task_groups={}
        self.lock=asyncio.Lock()

        self.consumer_task=asyncio.create_task(self._consumer())
        # single为True（默认）表示单个任务组内并发，为False表示多个任务组间组内同时并发
        self.single=single

    async def get_group_results(self,group_id):
        # 一定要在任务组结束后获取一次结果，只有任务组结束后并且获取结果才会销毁任务组的内存！任务组进行中也可以获取中间结果，可是不会销毁内存！
        async with self.lock:
            group=self.task_groups.get(group_id)
            if group:
                return group.get_results()

            completed_group=self.completed_task_groups.get(group_id)
            if completed_group:
                results=completed_group.get_results()
                self.completed_task_groups.pop(group_id, None)
                return results
            else:
                self.logger.warning(f"任务组:{group_id} 不存在")
                return None

    async def add_group(self,items:List[Any],g_id:str=None)-> Optional[str]:
        # 用户接口，用于一次添加任务组，返回任务组id
        if not items:
            return None

        group = TaskGroup(items,g_id)
        await self.queue.put(group)

        async with self.lock:
            self.task_groups[group.group_id]=group
            self.logger.info(f"[创建]任务组 {group.group_id}，包含{len(group.items)}个任务")

        return group.group_id

    async def cancel_group(self,group_id:str):
        # 用户接口，用于取消任务组
        async with self.lock:
            group=self.task_groups.get(group_id)
            if group:
                group.cancel()
            else:
                self.logger.warning(f"[取消]任务组 {group_id}不存在或已完成")
    async def wait_for_group(self,group_id:str):
        async with self.lock:
            group=self.task_groups.get(group_id)
            if group:
                await group.wait_for_completion()
            else:
                self.logger.success(f"[等待]任务组 {group_id}不存在或已完成")

    async def add_items_to_group(self,group_id=None,items:List[Any]=None):
        if not items:
            self.logger.warning("没有任务需要添加到任务组")
            return

        async with self.lock:
            group=self.task_groups.get(group_id)
            if group:
                for item in items:
                    group.add_item(item)
                self.logger.info(f"[新增]{len(items)}个任务到任务组 ({group_id})")
            else:
                new_group = TaskGroup(items, group_id)
                await self.queue.put(new_group)
                self.task_groups[new_group.group_id] = new_group
                self.logger.info(f"【添加】原任务组 ({group_id}) 已完成，创建了新组 ({new_group.group_id})")
    async def _consumer(self):
        while True:
            try:
                group=await self.queue.get()
            except asyncio.CancelledError:
                # self.logger.info("任务管理器已取消")
                try:
                    self.queue.task_done()
                except ValueError:
                    pass
                break

            task=asyncio.create_task(self._process_group(group))
            if self.single:
                await task
    async def close(self):
        if self.consumer_task and not self.consumer_task.done():
            self.consumer_task.cancel()
            try:
                await self.consumer_task
            except asyncio.CancelledError:
                pass

        async with self.lock:
            for group in self.task_groups.values():
                group.cancel()
        try:
            await self.queue.join()
        except Exception as e:
            self.logger.error(e)
    async def _process_group(self,group:TaskGroup):
        try :
            semaphore=asyncio.Semaphore(self.max_workers)
            tasks=[]

            for item in group.items:
                async def wrapped_task(i=item):
                    if await group.is_cancelled():
                        self.logger.info(f"跳过任务: {i}(所属组 {group.group_id}已取消)")
                        return

                    async with semaphore:
                        if await group.is_cancelled():
                            self.logger.info(f'跳过任务：{i}(等待信号量时候取消)')
                            return

                        try :
                            if isinstance(i,(list,tuple)):
                                result=await self.worker(*i)
                            elif isinstance(i,dict):
                                result=await self.worker(**i)
                            else:
                                result=await self.worker(i)
                            group.add_result(i,result)
                        except Exception as ex:
                            self.logger.error(f"任务组 {group.group_id}执行任务 {i} 失败: {ex}")
                            group.add_result(i,None)
                task=asyncio.create_task(wrapped_task())
                tasks.append(task)

            await asyncio.gather(*tasks,return_exceptions=True)

        except Exception as e:
            self.logger.error(f"任务组 {group.group_id}执行失败: {e}")
        finally:
            group.set_completed()
            async with self.lock:
                if group.group_id in self.task_groups:
                    self.task_groups.pop(group.group_id,None)
                    self.completed_task_groups[group.group_id]=group
            try:
                self.queue.task_done()
            except ValueError:
                pass
