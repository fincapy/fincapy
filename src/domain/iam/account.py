from src.domain.iam.user import User


class Account:
    def __init__(self, id: int, users: list[User], plaid_access_token: str):
        self.id = id
        self.users = users
        self.plaid_access_token = plaid_access_token
